-- ============================================================
-- Razorpay payment fields for prepaid bookings
-- Run in Supabase SQL Editor, after 00-master-schema.sql. Safe to re-run.
-- ============================================================
alter table bookings add column if not exists razorpay_order_id text;
alter table bookings add column if not exists razorpay_payment_id text;
alter table bookings add column if not exists razorpay_signature text;

-- 'failed' lets us record a payment attempt that didn't go through
-- without touching the 'pending' row a guest might still retry.
alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status in ('pending','paid','refunded','partial','failed'));

create index if not exists idx_bookings_razorpay_order on bookings(razorpay_order_id);
