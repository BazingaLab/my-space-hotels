-- ============================================================
-- CANCELLATION + REAL RAZORPAY REFUND — Phase 7B.
--
-- WHY: guest self-service cancellation (guestBookingController.cancel())
-- calls rpc_cancel_booking, which only ever did internal bookkeeping —
-- it reverses the wallet ledger UNCONDITIONALLY whenever a booking
-- credit exists, regardless of whether any external refund happened.
-- A real staging cancellation exposed this: the guest saw "full refund
-- will be processed" while Razorpay's own records showed
-- amount_refunded = 0. This migration lets the Node side route the
-- ACTUAL financial reversal through the existing Razorpay-integrated
-- rpc_refund_booking (23/27) for prepaid+captured bookings, then call
-- this function ONLY to flip status/inventory — without a second,
-- duplicate wallet reversal.
--
-- rpc_cancel_booking gets ONE new parameter, p_skip_wallet_reversal,
-- defaulting to false — every existing caller that doesn't pass it
-- keeps its exact current behavior. When true, the wallet-reversal
-- block is skipped entirely (the caller already reversed the wallet
-- via rpc_refund_booking) and reimbursement/payment_status are left
-- as whatever that refund call already set, rather than being
-- overwritten.
--
-- The old 5-parameter signature is explicitly dropped first — adding
-- a 6th defaulted parameter via CREATE OR REPLACE alone would leave
-- both signatures resolvable for a 5-named-argument call (Postgres
-- can satisfy the new function's defaulted 6th param too), which
-- makes every existing call ambiguous and breaks it. Dropping first
-- avoids that; every current caller passes named parameters, so
-- nothing else needs to change.
-- ============================================================

drop function if exists rpc_cancel_booking(uuid, text, numeric, text, uuid);

create or replace function rpc_cancel_booking(
  p_booking_id uuid,
  p_reason text,
  p_reimbursement numeric,
  p_new_payment_status text,
  p_actor_id uuid default null,
  p_skip_wallet_reversal boolean default false
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
    -- Falls back to the booking's CURRENT reimbursement (not 0) when
    -- p_reimbursement is null — lets a caller that already recorded
    -- the real reimbursement via rpc_refund_booking finish the status
    -- transition here without clobbering it back to zero.
    reimbursement = coalesce(p_reimbursement, v_booking.reimbursement, 0),
    payment_status = coalesce(p_new_payment_status, v_booking.payment_status)
  where id = p_booking_id
  returning * into v_booking;

  if not p_skip_wallet_reversal then
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
  end if;

  return v_booking;
end;
$$;

revoke execute on function rpc_cancel_booking(uuid, text, numeric, text, uuid, boolean) from public, anon, authenticated;
grant execute on function rpc_cancel_booking(uuid, text, numeric, text, uuid, boolean) to service_role;
