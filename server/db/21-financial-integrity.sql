-- ============================================================
-- FINANCIAL INTEGRITY — atomic wallet/ledger/booking operations.
-- Run in Supabase SQL Editor, after everything already applied
-- (through 20-rls-hardening.sql). Safe to re-run: every statement is
-- idempotent (create-or-replace / if-not-exists / drop-if-exists).
--
-- WHY: several JS controllers used a "read balance → compute in
-- Node → write back" pattern (postLedgerEntry, ensureWallet), or did
-- a multi-step booking-status update followed by a *best-effort*
-- (try/catch-swallowed) wallet adjustment (cancel, transfer). Under
-- concurrent requests both patterns can corrupt the books: two
-- concurrent credits to the same wallet can race and one clobber the
-- other's balance update; a transfer or cancellation can partially
-- apply (booking moved, wallet not adjusted) if the wallet step throws
-- after the booking step already committed.
--
-- Everything below moves the "read current state, decide, write" step
-- for money-moving operations into single Postgres functions, each of
-- which is one atomic transaction from Node's point of view — either
-- the whole thing lands, or none of it does. Row-level locks
-- (`for update`) replace the JS-level "read-then-write" race with
-- Postgres serializing genuinely concurrent writers.
--
-- These functions are called from Node via supabase.rpc(...) using
-- the service_role key. They are explicitly NOT exposed to the anon/
-- authenticated roles (see the revoke/grant after each one) — without
-- that, PostgREST would expose every one of these as a public HTTP
-- RPC endpoint, letting anyone with the public anon key move money
-- directly, bypassing every auth/ownership check in Express. This is
-- exactly the class of gap 20-rls-hardening.sql and the routing/auth
-- phase before it closed for direct table access — the same care
-- applies to functions.
-- ============================================================

-- ------------------------------------------------------------
-- Schema completeness: these columns are read/written throughout
-- walletController.js but were never captured in a tracked migration
-- (they exist in the live database already, added outside the
-- checked-in SQL history). Declared here, idempotently, so this
-- file's own functions can rely on them, and so the tracked SQL
-- history actually matches production. No-op on a database that
-- already has them.
-- ------------------------------------------------------------
alter table bookings
  add column if not exists commission_percent_applied numeric(5,2),
  add column if not exists commission_amount numeric(14,2),
  add column if not exists commission_waived boolean default false,
  add column if not exists commission_waiver_reason text;

-- ------------------------------------------------------------
-- Ledger idempotency constraints
-- ------------------------------------------------------------

-- One wallet may record at most ONE booking-credit, ONE
-- cancellation-reversal, ONE transfer-out and ONE transfer-in per
-- booking id. This is the actual duplicate-execution guard for
-- Part 5/6 — even if fn_post_ledger_entry is somehow invoked twice for
-- the same (wallet, operation, booking), the second insert fails here
-- instead of silently double-crediting or double-reversing.
create unique index if not exists uq_ledger_wallet_reftype_refid
  on ledger_entries (wallet_id, ref_type, ref_id)
  where ref_id is not null and ref_type in ('booking', 'cancellation', 'transfer_out', 'transfer_in');

-- A UTR is a bank reference for one real-world transfer — it must
-- never be recorded twice against the same wallet, regardless of how
-- many times the settle request is retried/duplicated.
create unique index if not exists uq_ledger_settlement_utr
  on ledger_entries (wallet_id, utr_number)
  where ref_type = 'settlement' and utr_number is not null;

-- ------------------------------------------------------------
-- fn_post_ledger_entry — the ONE place that writes a ledger row and
-- moves wallet_accounts.balance_cached. Locks the wallet row first, so
-- two concurrent postings to the SAME wallet are serialized by
-- Postgres, not raced in Node.
-- ------------------------------------------------------------
create or replace function fn_post_ledger_entry(
  p_wallet_id uuid,
  p_amount numeric,
  p_direction text,
  p_ref_type text,
  p_ref_id uuid default null,
  p_utr text default null,
  p_description text default '',
  p_created_by uuid default null
) returns ledger_entries
language plpgsql
as $$
declare
  v_balance numeric;
  v_balance_after numeric;
  v_entry ledger_entries;
begin
  if p_direction not in ('credit', 'debit') then
    raise exception 'Invalid ledger direction: %', p_direction using errcode = 'MSH01';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Ledger amount must be positive' using errcode = 'MSH01';
  end if;

  select balance_cached into v_balance from wallet_accounts where id = p_wallet_id for update;
  if not found then
    raise exception 'Wallet % not found', p_wallet_id using errcode = 'MSH01';
  end if;

  v_balance_after := v_balance + (case when p_direction = 'credit' then p_amount else -p_amount end);

  insert into ledger_entries (wallet_id, amount, direction, ref_type, ref_id, utr_number, description, balance_after, created_by)
  values (p_wallet_id, p_amount, p_direction, p_ref_type, p_ref_id, p_utr, p_description, v_balance_after, p_created_by)
  returning * into v_entry;

  update wallet_accounts set balance_cached = v_balance_after where id = p_wallet_id;

  return v_entry;
end;
$$;

revoke execute on function fn_post_ledger_entry(uuid, numeric, text, text, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function fn_post_ledger_entry(uuid, numeric, text, text, uuid, text, text, uuid) to service_role;

-- ------------------------------------------------------------
-- rpc_ensure_wallet — atomic get-or-create for a hotel's wallet.
-- Replaces the JS ensureWallet() read-then-insert, which could race on
-- a hotel's very first financial event and hit the
-- wallet_accounts.hotel_id unique constraint unhandled.
-- ------------------------------------------------------------
create or replace function rpc_ensure_wallet(p_hotel_id uuid)
returns wallet_accounts
language plpgsql
as $$
declare
  v_wallet wallet_accounts;
begin
  insert into wallet_accounts (hotel_id, balance_cached, initial_balance)
  values (p_hotel_id, 0, 0)
  on conflict (hotel_id) do update set hotel_id = excluded.hotel_id
  returning * into v_wallet;

  update hotels set wallet_id = v_wallet.id
    where id = p_hotel_id and (wallet_id is null or wallet_id <> v_wallet.id);

  return v_wallet;
end;
$$;

revoke execute on function rpc_ensure_wallet(uuid) from public, anon, authenticated;
grant execute on function rpc_ensure_wallet(uuid) to service_role;

-- ------------------------------------------------------------
-- rpc_credit_booking_to_wallet — credits a hotel's wallet for exactly
-- one confirmed booking, net of commission, and stamps the commission
-- fields onto the booking in the SAME transaction (Part 6: a booking
-- can now never end up with two different commission_amount postings
-- for the same ledger entry). Idempotent: calling this twice for the
-- same booking (verifyPayment and the Razorpay webhook both firing,
-- or a client retry) returns the original entry instead of crediting
-- twice.
-- ------------------------------------------------------------
create or replace function rpc_credit_booking_to_wallet(
  p_booking_id uuid,
  p_commission_percent numeric,
  p_eligible boolean,
  p_reason text
) returns ledger_entries
language plpgsql
as $$
declare
  v_booking bookings;
  v_wallet wallet_accounts;
  v_gross numeric;
  v_commission numeric;
  v_net numeric;
  v_entry ledger_entries;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id using errcode = 'MSH01';
  end if;

  v_gross := coalesce(v_booking.total_price, 0);
  v_commission := round(v_gross * coalesce(p_commission_percent, 0) / 100.0, 2);
  v_net := v_gross - v_commission;

  v_wallet := rpc_ensure_wallet(v_booking.hotel_id);

  begin
    v_entry := fn_post_ledger_entry(
      v_wallet.id, v_net, 'credit', 'booking', p_booking_id, null,
      format('Booking %s — gross Rs.%s, commission Rs.%s (%s%%)', left(p_booking_id::text, 8), v_gross, v_commission, coalesce(p_commission_percent, 0)),
      null
    );
  exception when unique_violation then
    select * into v_entry from ledger_entries
      where wallet_id = v_wallet.id and ref_type = 'booking' and ref_id = p_booking_id;
    return v_entry;
  end;

  update bookings set
    commission_percent_applied = p_commission_percent,
    commission_amount = v_commission,
    commission_waived = coalesce(p_eligible, false),
    commission_waiver_reason = p_reason
  where id = p_booking_id;

  return v_entry;
end;
$$;

revoke execute on function rpc_credit_booking_to_wallet(uuid, numeric, boolean, text) from public, anon, authenticated;
grant execute on function rpc_credit_booking_to_wallet(uuid, numeric, boolean, text) to service_role;

-- ------------------------------------------------------------
-- rpc_cancel_booking — atomically marks a booking cancelled and
-- reverses its wallet credit (if one exists). Locking the booking row
-- first and checking status inside the same transaction is what
-- prevents the same booking from being cancelled (and reversed) twice
-- by two concurrent requests — the second one's lock-wait resolves
-- into a clean "already cancelled" exception instead of a second
-- reversal.
-- ------------------------------------------------------------
create or replace function rpc_cancel_booking(
  p_booking_id uuid,
  p_reason text,
  p_reimbursement numeric,
  p_new_payment_status text,
  p_actor_id uuid default null
) returns bookings
language plpgsql
as $$
declare
  v_booking bookings;
  v_wallet wallet_accounts;
  v_credit ledger_entries;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id using errcode = 'MSH01';
  end if;
  if v_booking.status = 'cancelled' then
    raise exception 'Booking already cancelled' using errcode = 'MSH02';
  end if;

  update bookings set
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    reimbursement = coalesce(p_reimbursement, 0),
    payment_status = coalesce(p_new_payment_status, v_booking.payment_status)
  where id = p_booking_id
  returning * into v_booking;

  select * into v_credit from ledger_entries
    where ref_type = 'booking' and ref_id = p_booking_id and direction = 'credit'
    order by created_at desc limit 1;

  if found then
    v_wallet := rpc_ensure_wallet(v_booking.hotel_id);
    begin
      perform fn_post_ledger_entry(
        v_wallet.id, v_credit.amount, 'debit', 'cancellation', p_booking_id, null,
        format('Reversal - booking %s cancelled', left(p_booking_id::text, 8)),
        p_actor_id
      );
    exception when unique_violation then
      null; -- already reversed by a concurrent/retried call
    end;
  end if;

  return v_booking;
end;
$$;

revoke execute on function rpc_cancel_booking(uuid, text, numeric, text, uuid) from public, anon, authenticated;
grant execute on function rpc_cancel_booking(uuid, text, numeric, text, uuid) to service_role;

-- ------------------------------------------------------------
-- rpc_transfer_booking — atomically moves a booking to another hotel
-- and adjusts both wallets. Locks both hotel rows in a fixed order (by
-- id) so two transfers touching the same two hotels in opposite
-- directions can never deadlock. Either the booking moves AND both
-- wallets adjust, or none of it happens — closes the "hotel A loses
-- the booking but hotel B's wallet never gets credited" failure mode
-- from the old best-effort try/catch version.
-- ------------------------------------------------------------
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

  if v_old_hotel_id < p_new_hotel_id then
    v_first_hotel := v_old_hotel_id; v_second_hotel := p_new_hotel_id;
  else
    v_first_hotel := p_new_hotel_id; v_second_hotel := v_old_hotel_id;
  end if;
  perform 1 from hotels where id = v_first_hotel for update;
  perform 1 from hotels where id = v_second_hotel for update;

  select commission_percent into v_new_commission from hotels where id = p_new_hotel_id;
  if not found then
    raise exception 'Destination hotel % not found', p_new_hotel_id using errcode = 'MSH01';
  end if;

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
-- rpc_settle_wallet — records a payout debit with UTR dedup and a
-- balance-sufficiency check that's actually race-proof (the previous
-- phase's Node-level "check then insert" pre-check for duplicate UTRs
-- had the same TOCTOU gap this whole file exists to close).
-- ------------------------------------------------------------
create or replace function rpc_settle_wallet(
  p_hotel_id uuid,
  p_amount numeric,
  p_utr text,
  p_description text,
  p_created_by uuid default null
) returns ledger_entries
language plpgsql
as $$
declare
  v_wallet wallet_accounts;
  v_entry ledger_entries;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be a positive number' using errcode = 'MSH01';
  end if;

  v_wallet := rpc_ensure_wallet(p_hotel_id);

  select * into v_wallet from wallet_accounts where id = v_wallet.id for update;

  if p_amount > v_wallet.balance_cached then
    raise exception 'Settlement exceeds available balance' using errcode = 'MSH02';
  end if;

  if p_utr is not null and exists (
    select 1 from ledger_entries where wallet_id = v_wallet.id and ref_type = 'settlement' and utr_number = p_utr
  ) then
    raise exception 'A settlement with this UTR has already been recorded for this hotel' using errcode = 'MSH03';
  end if;

  v_entry := fn_post_ledger_entry(v_wallet.id, p_amount, 'debit', 'settlement', null, p_utr,
    coalesce(p_description, 'Settlement payout'), p_created_by);

  return v_entry;
end;
$$;

revoke execute on function rpc_settle_wallet(uuid, numeric, text, text, uuid) from public, anon, authenticated;
grant execute on function rpc_settle_wallet(uuid, numeric, text, text, uuid) to service_role;

-- ------------------------------------------------------------
-- rpc_create_booking — the availability check AND the insert, as one
-- atomic unit (Part 10). Locks the hotel row first: any other booking
-- attempt for the SAME hotel blocks here until this transaction
-- commits (or rolls back), so the overlap count below always reflects
-- every booking that's genuinely ahead of it, closing the classic
-- "two requests both pass the check, both insert" double-booking race.
-- Coarse-grained (locks per hotel, not per room) — correct for this
-- schema, since `rooms` is a total capacity count, not individually
-- tracked rooms; this is the existing data model, not a redesign of it.
--
-- The overlap-window comparison mirrors availability.js's
-- bookingWindow() exactly (nightly uses the hotel's own checkin/
-- checkout times, defaulting to 14:00/11:00; hourly uses its stored
-- timestamps) so this never disagrees with the pre-flight
-- checkAvailability() read used for UI feedback before submit.
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
  v_rooms int;
  v_checkin_time time;
  v_checkout_time time;
  v_overlap_count int;
  v_new_booking bookings;
begin
  select rooms, checkin_time, checkout_time into v_rooms, v_checkin_time, v_checkout_time
    from hotels where id = p_hotel_id for update;
  if not found then
    raise exception 'Hotel % not found', p_hotel_id using errcode = 'MSH01';
  end if;

  select count(*) into v_overlap_count
  from bookings b
  where b.hotel_id = p_hotel_id
    and b.status <> 'cancelled'
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

  if v_overlap_count >= coalesce(v_rooms, 0) then
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

