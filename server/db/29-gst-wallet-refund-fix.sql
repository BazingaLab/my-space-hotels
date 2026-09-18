-- ============================================================
-- GST WALLET REFUND ACCOUNTING FIX — Phase 7C.
--
-- ROOT CAUSE: rpc_credit_booking_to_wallet (21-financial-integrity.sql)
-- credits the wallet with v_gross := total_price (GST-EXCLUSIVE, net of
-- commission) — the wallet has never held the GST portion of a booking,
-- by design. rpc_refund_booking's wallet-debit formula, however,
-- computed v_wallet_debit := p_amount * (1 - commission%) directly off
-- p_amount — the GUEST-facing refund amount, which since Phase 6/7 is
-- correctly grand_total-based (GST-INCLUSIVE). Whenever GST > 0, this
-- debited more from the wallet than was ever credited to it. Proven
-- empirically via a real Razorpay Test Mode refund: booking credited
-- Rs.3000, refund wallet-debited Rs.3150 — a Rs.150 (the exact GST
-- amount) unexplained wallet loss.
--
-- FIX: reverse the SAME PROPORTION of the ORIGINAL wallet credit
-- (looked up from the actual ledger entry, the authoritative source —
-- same pattern rpc_cancel_booking already uses) as the fraction of the
-- guest's total payment being refunded. A full refund (p_amount =
-- grand_total) reverses the entire original credit; a partial refund
-- reverses that same fraction of it. The guest-facing refund amount,
-- the refund cap (against grand_total), and reimbursement are
-- UNCHANGED — this only changes what gets posted to the wallet ledger.
--
-- Same 5-parameter signature as before — no callers need to change.
-- Purely a replace of the function body; no schema/table changes, no
-- historical ledger rows are touched or rewritten.
-- ============================================================

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
  v_original_credit numeric;
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
  -- Guest-facing cap stays grand_total-based (Phase 6 fix, preserved) —
  -- this is what Razorpay actually captured and what the guest actually paid.
  if v_already_refunded + p_amount > v_booking.grand_total then
    raise exception 'Refund would exceed the booking total (already refunded %, requested %, total %)',
      v_already_refunded, p_amount, v_booking.grand_total using errcode = 'MSH02';
  end if;

  -- Wallet reversal basis: the actual amount originally posted to the
  -- ledger for this booking (GST-exclusive, net of commission) — NOT
  -- p_amount, which is GST-inclusive. Scale it by the fraction of the
  -- guest's total payment this refund represents.
  select amount into v_original_credit from ledger_entries
    where ref_type = 'booking' and ref_id = p_booking_id and direction = 'credit'
    order by created_at desc limit 1;

  if v_original_credit is not null and v_booking.grand_total > 0 then
    v_wallet_debit := round(v_original_credit * (p_amount / v_booking.grand_total), 2);
  else
    -- Never actually credited (pay-at-hotel, goodwill, waived) —
    -- nothing to reverse, same as before.
    v_wallet_debit := 0;
  end if;

  if v_wallet_debit > 0 then
    v_wallet := rpc_ensure_wallet(v_booking.hotel_id);
    begin
      perform fn_post_ledger_entry(
        v_wallet.id, v_wallet_debit, 'debit', 'refund', p_booking_id, p_reference,
        format('Refund - booking %s: guest refund Rs.%s, wallet reversal Rs.%s (%s)',
          left(p_booking_id::text, 8), p_amount, v_wallet_debit, coalesce(p_reason, 'no reason given')),
        p_actor_id
      );
    exception when unique_violation then
      raise exception 'A refund with this reference has already been recorded' using errcode = 'MSH03';
    end;
  end if;

  update bookings set
    reimbursement = v_already_refunded + p_amount,
    payment_status = case when v_already_refunded + p_amount >= v_booking.grand_total then 'refunded' else 'partial' end
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke execute on function rpc_refund_booking(uuid, numeric, text, text, uuid) from public, anon, authenticated;
grant execute on function rpc_refund_booking(uuid, numeric, text, text, uuid) to service_role;
