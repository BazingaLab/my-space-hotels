-- ============================================================
-- INVENTORY BLOCKING + CANONICAL AVAILABILITY — Phase 3.
-- Run after 23-refund-workflow.sql. Safe to re-run.
--
-- Adds the minimum schema needed to let an owner block N rooms for a
-- date range without cancelling existing guest bookings, and ONE
-- canonical availability function that search, hotel detail, the
-- booking RPC, the owner calendar, and the admin view all call — so
-- there is exactly one place in the whole system that knows how to
-- count "how many rooms are free for this window."
--
-- hotels.rooms remains the only capacity signal (total simultaneous
-- inventory, not individually numbered rooms) — no room-types table,
-- no per-room allocation. That is an explicit, deliberate scope
-- boundary for this phase, not an oversight.
-- ============================================================

-- ------------------------------------------------------------
-- inventory_blocks — one row per "N rooms unavailable from X to Y"
-- decision. Mirrors bookings.check_in/check_out's own [start, end)
-- convention (end_date is the day inventory becomes free again, same
-- as a checkout date) so it can reuse the exact same overlap logic.
-- is_active is a soft-delete flag — "unblock" deactivates a row rather
-- than deleting it, so the audit trail (who blocked what, when) survives.
-- ------------------------------------------------------------
create table if not exists inventory_blocks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  quantity int not null check (quantity > 0),
  reason text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  deactivated_by uuid references auth.users(id) on delete set null,
  deactivated_at timestamptz,
  created_at timestamptz default now(),
  constraint inventory_blocks_valid_range check (end_date > start_date)
);
create index if not exists idx_inventory_blocks_hotel on inventory_blocks(hotel_id, is_active);

alter table inventory_blocks enable row level security;
-- Same owner-isolation shape as bookings/complaints (22-rls-owner-isolation.sql):
-- super_admin sees everything, a hotel_admin sees only their own hotel's
-- blocks. No insert/update/delete policy for anon/authenticated — all
-- writes go through the service_role-only RPCs below (default-deny).
drop policy if exists inventory_blocks_read on inventory_blocks;
create policy inventory_blocks_read on inventory_blocks for select using (
  is_super_admin()
  or exists (select 1 from hotels h where h.id = inventory_blocks.hotel_id and h.owner_id = auth.uid())
);

-- ------------------------------------------------------------
-- fn_compute_availability — THE canonical calculation.
-- total = hotels.rooms
-- booked = count of non-cancelled bookings whose occupied window
--          (nightly: hotel's own checkin/checkout time; hourly: exact
--          stored timestamps — identical logic to rpc_create_booking)
--          overlaps [p_window_start, p_window_end)
-- blocked = sum(quantity) of active inventory_blocks whose full-day
--           range overlaps the same window
-- available = total - booked - blocked (NOT clamped to zero here —
--           callers decide how to present a negative number; the
--           guest-facing paths clamp to zero, the owner calendar shows
--           the raw value so an intentional over-block is visible).
-- ------------------------------------------------------------
create or replace function fn_compute_availability(
  p_hotel_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_exclude_booking_id uuid default null
) returns table(total_rooms int, booked int, blocked int, available int)
language plpgsql
as $$
declare
  v_rooms int;
  v_checkin_time time;
  v_checkout_time time;
  v_booked int;
  v_blocked int;
begin
  select rooms, checkin_time, checkout_time into v_rooms, v_checkin_time, v_checkout_time
    from hotels where id = p_hotel_id;
  if not found then
    raise exception 'Hotel % not found', p_hotel_id using errcode = 'MSH01';
  end if;

  select count(*) into v_booked
  from bookings b
  where b.hotel_id = p_hotel_id
    and b.status <> 'cancelled'
    and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
    and (
      case when b.booking_type = 'hourly' and b.checkin_datetime is not null
           then b.checkin_datetime
           else (b.check_in::text || ' ' || coalesce(v_checkin_time, time '14:00'))::timestamptz
      end
    ) < p_window_end
    and (
      case when b.booking_type = 'hourly' and b.checkout_datetime is not null
           then b.checkout_datetime
           else (b.check_out::text || ' ' || coalesce(v_checkout_time, time '11:00'))::timestamptz
      end
    ) > p_window_start;

  select coalesce(sum(quantity), 0) into v_blocked
  from inventory_blocks ib
  where ib.hotel_id = p_hotel_id
    and ib.is_active
    and ib.start_date::timestamptz < p_window_end
    and ib.end_date::timestamptz > p_window_start;

  return query select v_rooms, v_booked, v_blocked, (v_rooms - v_booked - v_blocked);
end;
$$;

revoke execute on function fn_compute_availability(uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
grant execute on function fn_compute_availability(uuid, timestamptz, timestamptz, uuid) to service_role;

-- ------------------------------------------------------------
-- fn_availability_calendar — day-by-day view for the owner calendar
-- and admin screen. NOT a second calculation: it calls
-- fn_compute_availability once per day, so it can never disagree with
-- it. Bounded to <= 92 days per call at the Express layer, not here.
-- ------------------------------------------------------------
create or replace function fn_availability_calendar(
  p_hotel_id uuid,
  p_start_date date,
  p_end_date date
) returns table(day date, total_rooms int, booked int, blocked int, available int)
language plpgsql
as $$
declare
  v_day date;
  v_avail record;
begin
  v_day := p_start_date;
  while v_day < p_end_date loop
    select * into v_avail from fn_compute_availability(p_hotel_id, v_day::timestamptz, (v_day + 1)::timestamptz);
    day := v_day;
    total_rooms := v_avail.total_rooms;
    booked := v_avail.booked;
    blocked := v_avail.blocked;
    available := v_avail.available;
    return next;
    v_day := v_day + 1;
  end loop;
  return;
end;
$$;

revoke execute on function fn_availability_calendar(uuid, date, date) from public, anon, authenticated;
grant execute on function fn_availability_calendar(uuid, date, date) to service_role;

-- ------------------------------------------------------------
-- rpc_create_inventory_block — atomic, capacity-aware block creation.
-- Locks the hotel row (same lock rpc_create_booking takes) so a
-- concurrent block request and a concurrent booking request for the
-- SAME hotel are serialized against each other, not just against
-- requests of their own kind (Section 10's race). Checks EVERY day in
-- the requested range (not just the endpoints — an existing booking or
-- another block partway through the range can make a single day the
-- tightest constraint). Never touches bookings — an over-block is
-- flagged, not resolved by cancelling a guest's stay.
-- p_force lets an owner knowingly proceed anyway (Section 5's "clear
-- warning and require an explicit decision") — this override exists
-- ONLY for owner-initiated blocks; rpc_create_booking has no such
-- override, a guest booking can never exceed capacity.
-- ------------------------------------------------------------
create or replace function rpc_create_inventory_block(
  p_hotel_id uuid,
  p_start_date date,
  p_end_date date,
  p_quantity int,
  p_reason text,
  p_actor_id uuid,
  p_force boolean default false
) returns inventory_blocks
language plpgsql
as $$
declare
  v_day date;
  v_avail record;
  v_worst_available int;
  v_worst_day date;
  v_block inventory_blocks;
begin
  if p_end_date <= p_start_date then
    raise exception 'end_date must be after start_date' using errcode = 'MSH01';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be a positive number' using errcode = 'MSH01';
  end if;

  perform 1 from hotels where id = p_hotel_id for update;
  if not found then
    raise exception 'Hotel % not found', p_hotel_id using errcode = 'MSH01';
  end if;

  v_worst_available := null;
  v_day := p_start_date;
  while v_day < p_end_date loop
    select * into v_avail from fn_compute_availability(p_hotel_id, v_day::timestamptz, (v_day + 1)::timestamptz);
    if v_worst_available is null or (v_avail.available - p_quantity) < v_worst_available then
      v_worst_available := v_avail.available - p_quantity;
      v_worst_day := v_day;
    end if;
    v_day := v_day + 1;
  end loop;

  if v_worst_available < 0 and not p_force then
    raise exception 'Blocking % room(s) would leave % available on % (capacity exceeded) — existing bookings are never cancelled automatically; pass force=true to proceed anyway',
      p_quantity, v_worst_available, v_worst_day using errcode = 'MSH04';
  end if;

  insert into inventory_blocks (hotel_id, start_date, end_date, quantity, reason, created_by)
  values (p_hotel_id, p_start_date, p_end_date, p_quantity, p_reason, p_actor_id)
  returning * into v_block;

  return v_block;
end;
$$;

revoke execute on function rpc_create_inventory_block(uuid, date, date, int, text, uuid, boolean) from public, anon, authenticated;
grant execute on function rpc_create_inventory_block(uuid, date, date, int, text, uuid, boolean) to service_role;

-- ------------------------------------------------------------
-- rpc_create_booking — SUPERSEDES the version in
-- 21-financial-integrity.sql. Identical signature; the body now
-- delegates its capacity check to fn_compute_availability (so blocks
-- are respected, and there is only one overlap calculation in the
-- whole system) instead of running its own inline copy of the overlap
-- query. Still locks the hotel row first, for the same reason as before.
-- ------------------------------------------------------------
create or replace function rpc_create_booking(
  p_hotel_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_check_in date,
  p_check_out date,
  p_guests int,
  p_nights int,
  p_total_price numeric,
  p_gst_rate numeric,
  p_gst_amount numeric,
  p_grand_total numeric,
  p_meal_plan text,
  p_breakfast_price_applied numeric,
  p_booking_type text,
  p_slot_hours int,
  p_checkin_datetime timestamptz,
  p_checkout_datetime timestamptz,
  p_status text,
  p_payment_mode text,
  p_payment_status text,
  p_special_request text,
  p_user_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns bookings
language plpgsql
as $$
declare
  v_avail record;
  v_new_booking bookings;
begin
  perform 1 from hotels where id = p_hotel_id for update;
  if not found then
    raise exception 'Hotel % not found', p_hotel_id using errcode = 'MSH01';
  end if;

  select * into v_avail from fn_compute_availability(p_hotel_id, p_window_start, p_window_end);
  if v_avail.available <= 0 then
    raise exception 'Sold out for the selected dates' using errcode = 'MSH02';
  end if;

  insert into bookings (
    hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, nights,
    total_price, gst_rate, gst_amount, grand_total, meal_plan, breakfast_price_applied,
    booking_type, slot_hours, checkin_datetime, checkout_datetime, status, payment_mode,
    payment_status, special_request, user_id
  ) values (
    p_hotel_id, p_guest_name, p_guest_email, p_guest_phone, p_check_in, p_check_out, p_guests, p_nights,
    p_total_price, p_gst_rate, p_gst_amount, p_grand_total, p_meal_plan, p_breakfast_price_applied,
    p_booking_type, p_slot_hours, p_checkin_datetime, p_checkout_datetime, p_status, p_payment_mode,
    p_payment_status, p_special_request, p_user_id
  )
  returning * into v_new_booking;

  return v_new_booking;
end;
$$;

revoke execute on function rpc_create_booking(uuid, text, text, text, date, date, int, int, numeric, numeric, numeric, numeric, text, numeric, text, int, timestamptz, timestamptz, text, text, text, text, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function rpc_create_booking(uuid, text, text, text, date, date, int, int, numeric, numeric, numeric, numeric, text, numeric, text, int, timestamptz, timestamptz, text, text, text, text, uuid, timestamptz, timestamptz) to service_role;
