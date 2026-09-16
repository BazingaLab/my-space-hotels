-- ============================================================
-- REFUND WORKFLOW — a dedicated, atomic, idempotent financial action,
-- so a generic booking PATCH can no longer fake a "refunded" state.
-- Run after 21-financial-integrity.sql. Safe to re-run.
--
-- WHY: bookingMgmtController.update() (PATCH /api/booking-mgmt/:id)
-- allowed setting payment_status directly to 'refunded' with zero
-- financial effect — no wallet reversal, no ledger entry, nothing.
-- An admin could mark a booking "refunded" that was never actually
-- reversed anywhere in the books. This migration adds the dedicated
-- financial action (rpc_refund_booking); the Node side (see
-- bookingMgmtController.js) now rejects payment_status:'refunded'/
-- 'partial' on the generic PATCH and requires this endpoint instead.
--
-- A refund is intentionally its own thing, separate from
-- rpc_cancel_booking — a stay can be refunded (fully or partially)
-- without being cancelled (e.g. a service issue during a stay that
-- still happened), and can be refunded more than once (a partial
-- refund now, another partial refund later). So unlike the
-- booking-credit/cancellation-reversal/transfer entries, refunds are
-- NOT limited to one per booking — the idempotency guard here is
-- instead "one per (wallet, reference)", the same shape as settlement's
-- UTR dedup: the caller must supply a reference (a UUID, a support
-- ticket id, anything unique to that specific refund action), and the
-- same reference can never be recorded twice.
-- ============================================================

create unique index if not exists uq_ledger_refund_reference
  on ledger_entries (wallet_id, utr_number)
  where ref_type = 'refund' and utr_number is not null;

-- Reverses the hotel's wallet net of the SAME commission rate the
-- original booking was credited at, proportional to the refunded
-- amount — the natural generalization of the existing full-cancellation
-- reversal (which reverses the whole net-credited amount) to a partial
-- amount. If a booking's commission_percent_applied is null (never
-- credited — e.g. a pay-at-hotel booking that was never actually paid,
-- or an abandoned prepaid attempt), the wallet debit is skipped
-- entirely (there's nothing to reverse) but the booking's
-- reimbursement/payment_status still update, since a refund can be a
-- pure bookkeeping/goodwill record independent of whether money ever
-- moved through the platform's wallet.
create or replace function rpc_refund_booking(
  p_booking_id uuid,
  p_amount numeric,
  p_reference text,
  p_reason text,
  p_actor_id uuid default null
) returns bookings
language plpgsql
as $$
declare
  v_booking bookings;
  v_wallet wallet_accounts;
  v_already_refunded numeric;
  v_wallet_debit numeric;
  v_commission_pct numeric;
begin
  if p_reference is null or length(trim(p_reference)) = 0 then
    raise exception 'A refund reference is required' using errcode = 'MSH01';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Refund amount must be positive' using errcode = 'MSH01';
  end if;

  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking % not found', p_booking_id using errcode = 'MSH01';
  end if;

  v_already_refunded := coalesce(v_booking.reimbursement, 0);
  if v_already_refunded + p_amount > v_booking.total_price then
    raise exception 'Refund would exceed the booking total (already refunded %, requested %, total %)',
      v_already_refunded, p_amount, v_booking.total_price using errcode = 'MSH02';
  end if;

  v_commission_pct := coalesce(v_booking.commission_percent_applied, 0);
  v_wallet_debit := round(p_amount * (1 - v_commission_pct / 100.0), 2);

  if v_wallet_debit > 0 then
    v_wallet := rpc_ensure_wallet(v_booking.hotel_id);
    begin
      perform fn_post_ledger_entry(
        v_wallet.id, v_wallet_debit, 'debit', 'refund', p_booking_id, p_reference,
        format('Refund - booking %s: Rs.%s (%s)', left(p_booking_id::text, 8), p_amount, coalesce(p_reason, 'no reason given')),
        p_actor_id
      );
    exception when unique_violation then
      raise exception 'A refund with this reference has already been recorded' using errcode = 'MSH03';
    end;
  end if;

  update bookings set
    reimbursement = v_already_refunded + p_amount,
    payment_status = case when v_already_refunded + p_amount >= v_booking.total_price then 'refunded' else 'partial' end
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke execute on function rpc_refund_booking(uuid, numeric, text, text, uuid) from public, anon, authenticated;
grant execute on function rpc_refund_booking(uuid, numeric, text, text, uuid) to service_role;
