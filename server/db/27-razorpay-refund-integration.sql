-- ============================================================
-- RAZORPAY REFUND INTEGRATION — Phase 7.
--
-- WHY: rpc_refund_booking (23-refund-workflow.sql) only ever did
-- internal bookkeeping — it reversed the wallet ledger and updated
-- bookings.payment_status/reimbursement, but never called Razorpay's
-- refund API. The books could say "refunded" while no money ever
-- actually moved back to the guest. This migration adds the tracking
-- table the Node side (bookingMgmtController.refund) uses to make an
-- ATOMIC-AS-POSSIBLE two-phase refund: reserve an attempt locally
-- (dedups on (booking_id, reference) BEFORE ever calling Razorpay,
-- so a retried/duplicated request never reaches the gateway twice),
-- call Razorpay, then commit the existing rpc_refund_booking. If the
-- commit step fails AFTER Razorpay already succeeded, the attempt row
-- is updated to 'gateway_succeeded_local_failed' with the real
-- Razorpay refund id attached — an auditable trail for manual
-- reconciliation, instead of either a silent loss or a false success.
--
-- Purely additive. Safe to re-run (create-if-not-exists / replace).
-- ============================================================

create table if not exists razorpay_refund_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  razorpay_payment_id text not null,
  amount numeric not null check (amount > 0),
  reference text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'gateway_succeeded_local_failed')),
  razorpay_refund_id text,
  error_detail text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The idempotency guard: the SAME (booking, reference) can only ever
  -- be reserved once, so a duplicate/retried request is rejected here,
  -- before Razorpay is ever called a second time for it.
  unique (booking_id, reference)
);

create index if not exists idx_razorpay_refund_attempts_booking on razorpay_refund_attempts(booking_id);
-- Surfaces anything stuck needing manual reconciliation.
create index if not exists idx_razorpay_refund_attempts_needs_reconciliation
  on razorpay_refund_attempts(status) where status = 'gateway_succeeded_local_failed';

alter table razorpay_refund_attempts enable row level security;
-- No policies — locked to service_role only, same pattern as
-- ledger_entries and wallet_accounts (01-rls-policies.sql). The
-- Express app always reads/writes this via the service-role client.

-- ------------------------------------------------------------
-- rpc_reserve_refund_attempt — Phase 1 of the two-phase refund.
-- Validates the booking is actually eligible for a Razorpay refund
-- and atomically claims (booking_id, reference) via the unique index
-- above, BEFORE any call to Razorpay is made. Mirrors
-- rpc_refund_booking's own validation (booking exists, amount
-- positive, doesn't exceed grand_total net of what's already been
-- refunded) so an obviously-invalid request never reaches the
-- gateway at all.
-- ------------------------------------------------------------
create or replace function rpc_reserve_refund_attempt(
  p_booking_id uuid,
  p_razorpay_payment_id text,
  p_amount numeric,
  p_reference text,
  p_actor_id uuid default null
) returns razorpay_refund_attempts
language plpgsql
as $$
declare
  v_booking bookings;
  v_already_refunded numeric;
  v_attempt razorpay_refund_attempts;
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
  if v_booking.razorpay_payment_id is distinct from p_razorpay_payment_id then
    raise exception 'Razorpay payment id does not match this booking' using errcode = 'MSH01';
  end if;
  if v_booking.payment_status not in ('paid', 'partial') then
    raise exception 'Booking payment status (%) is not eligible for a Razorpay refund', v_booking.payment_status using errcode = 'MSH02';
  end if;

  v_already_refunded := coalesce(v_booking.reimbursement, 0);
  if v_already_refunded + p_amount > v_booking.grand_total then
    raise exception 'Refund would exceed the booking total (already refunded %, requested %, total %)',
      v_already_refunded, p_amount, v_booking.grand_total using errcode = 'MSH02';
  end if;

  begin
    insert into razorpay_refund_attempts (booking_id, razorpay_payment_id, amount, reference, created_by)
    values (p_booking_id, p_razorpay_payment_id, p_amount, p_reference, p_actor_id)
    returning * into v_attempt;
  exception when unique_violation then
    raise exception 'This refund reference has already been used for this booking' using errcode = 'MSH03';
  end;

  return v_attempt;
end;
$$;

revoke execute on function rpc_reserve_refund_attempt(uuid, text, numeric, text, uuid) from public, anon, authenticated;
grant execute on function rpc_reserve_refund_attempt(uuid, text, numeric, text, uuid) to service_role;
