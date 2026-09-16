-- ============================================================
-- TRANSFER CAPACITY FIX + LEDGER INDEX — Phase 4A.
-- Run after 24-inventory-blocking.sql. Safe to re-run.
--
-- P0 FIX: rpc_transfer_booking (defined in 21-financial-integrity.sql)
-- moved a booking to another hotel and adjusted both wallets, but never
-- checked whether the DESTINATION hotel actually had room for it —
-- confirmed by direct re-read during the Phase 3.5 audit. A booking
-- could be "transferred" into an already sold-out or fully-blocked
-- hotel and the transfer would still succeed. This redefines the
-- function (identical signature, so this CREATE OR REPLACE genuinely
-- replaces the Phase 2 version in place — same function, not a
-- duplicate overload) to check the canonical fn_compute_availability
-- before moving anything, using the booking's own stay type/window
-- evaluated against the DESTINATION hotel's own checkin/checkout
-- times, and never bypassable — there is no force parameter here, a
-- guest booking (or the booking a transfer creates at the destination)
-- can never exceed capacity, full stop.
-- ============================================================

create or replace function rpc_transfer_booking(
  p_booking_id uuid,
  p_new_hotel_id uuid,
  p_actor_id uuid default null
) returns bookings
language plpgsql
as $$
declare
  v_booking bookings;
  v_old_hotel_id uuid;
  v_first_hotel uuid;
  v_second_hotel uuid;
  v_new_commission numeric;
  v_new_checkin_time time;
  v_new_checkout_time time;
  v_new_available boolean;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_avail record;
  v_old_wallet wallet_accounts;
  v_new_wallet wallet_accounts;
  v_credit ledger_entries;
  v_net numeric;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id using errcode = 'MSH01';
  end if;
  if v_booking.status = 'cancelled' then
    raise exception 'Cannot transfer a cancelled booking' using errcode = 'MSH02';
  end if;
  if v_booking.hotel_id = p_new_hotel_id then
    raise exception 'Booking is already at that hotel' using errcode = 'MSH02';
  end if;

  v_old_hotel_id := v_booking.hotel_id;

  -- Same deterministic lock ordering as before — unchanged.
  if v_old_hotel_id < p_new_hotel_id then
    v_first_hotel := v_old_hotel_id; v_second_hotel := p_new_hotel_id;
  else
    v_first_hotel := p_new_hotel_id; v_second_hotel := v_old_hotel_id;
  end if;
  perform 1 from hotels where id = v_first_hotel for update;
  perform 1 from hotels where id = v_second_hotel for update;

  select commission_percent, checkin_time, checkout_time, available
    into v_new_commission, v_new_checkin_time, v_new_checkout_time, v_new_available
    from hotels where id = p_new_hotel_id;
  if not found then
    raise exception 'Destination hotel % not found', p_new_hotel_id using errcode = 'MSH01';
  end if;
  -- The one eligibility flag actually enforced elsewhere in the app
  -- (hotelController.getHotels filters search on it) — hotels.hotel_status
  -- exists but is never read anywhere, so checking it here would be
  -- enforcing a rule nothing else enforces; not doing that.
  if not coalesce(v_new_available, true) then
    raise exception 'Destination hotel is not currently available for bookings' using errcode = 'MSH02';
  end if;

  -- The booking's occupied window, evaluated at the DESTINATION's own
  -- checkin/checkout times for a nightly stay (the guest will actually
  -- be checking in/out under hotel B's hours) — hourly bookings use
  -- their exact stored timestamps regardless of which hotel, since the
  -- guest picked an absolute time, not a hotel-relative slot. This is
  -- the same window logic as computeBookingWindow() in availability.js,
  -- evaluated here in SQL because it's the destination hotel's own
  -- times that matter, not the source's.
  if v_booking.booking_type = 'hourly' and v_booking.checkin_datetime is not null and v_booking.checkout_datetime is not null then
    v_window_start := v_booking.checkin_datetime;
    v_window_end := v_booking.checkout_datetime;
  else
    v_window_start := (v_booking.check_in::text || ' ' || coalesce(v_new_checkin_time, time '14:00'))::timestamptz;
    v_window_end := (v_booking.check_out::text || ' ' || coalesce(v_new_checkout_time, time '11:00'))::timestamptz;
  end if;

  -- THE canonical calculation — no duplicated availability logic here.
  -- p_exclude_booking_id is defensive: at this point the booking's
  -- hotel_id is still the OLD hotel, so it wouldn't be counted against
  -- the destination anyway, but excluding it explicitly means this
  -- stays correct even if this check is ever moved after the hotel_id
  -- update.
  select * into v_avail from fn_compute_availability(p_new_hotel_id, v_window_start, v_window_end, p_booking_id);
  if v_avail.available <= 0 then
    raise exception 'Destination hotel has no available inventory for this booking''s dates' using errcode = 'MSH02';
  end if;

  -- Only past this point does anything actually change — an exception
  -- above rolls back the whole transaction, including the locks taken,
  -- so a failed capacity check leaves the source booking and both
  -- wallets completely untouched.
  update bookings set hotel_id = p_new_hotel_id, transferred_from_hotel = v_old_hotel_id
    where id = p_booking_id
    returning * into v_booking;

  select * into v_credit from ledger_entries
    where ref_type = 'booking' and ref_id = p_booking_id and direction = 'credit'
    order by created_at desc limit 1;

  if found then
    v_old_wallet := rpc_ensure_wallet(v_old_hotel_id);
    begin
      perform fn_post_ledger_entry(v_old_wallet.id, v_credit.amount, 'debit', 'transfer_out', p_booking_id, null,
        format('Transfer out - booking %s', left(p_booking_id::text, 8)), p_actor_id);
    exception when unique_violation then null;
    end;

    v_net := round(coalesce(v_booking.total_price, 0) * (1 - coalesce(v_new_commission, 0) / 100.0), 2);
    v_new_wallet := rpc_ensure_wallet(p_new_hotel_id);
    begin
      perform fn_post_ledger_entry(v_new_wallet.id, v_net, 'credit', 'transfer_in', p_booking_id, null,
        format('Transfer in - booking %s', left(p_booking_id::text, 8)), p_actor_id);
    exception when unique_violation then null;
    end;
  end if;

  return v_booking;
end;
$$;

revoke execute on function rpc_transfer_booking(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function rpc_transfer_booking(uuid, uuid, uuid) to service_role;

-- ------------------------------------------------------------
-- Ledger lookup index — Phase 3.5 finding. rpc_cancel_booking,
-- rpc_transfer_booking (both the old and new version above), and
-- rpc_credit_booking_to_wallet's duplicate-check all look up ledger
-- rows by `where ref_type = ? and ref_id = ?` with no wallet_id in the
-- filter — the existing indexes (the unique partial index from
-- 21-financial-integrity.sql, and idx_ledger_wallet) both lead with
-- wallet_id, so neither serves this lookup. Purely additive — no
-- financial behavior changes, just makes an existing query pattern use
-- an index instead of a sequential scan as the table grows.
-- ------------------------------------------------------------
create index if not exists idx_ledger_reftype_refid on ledger_entries(ref_type, ref_id);
