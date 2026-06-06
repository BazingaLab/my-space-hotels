-- ============================================================
-- BOOKING LIFECYCLE — adds columns for status flow, payments,
-- discounts, transfers, special requests. Run in Supabase. Safe to re-run.
-- ============================================================
alter table bookings
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_mode text default 'pay_at_hotel',
  add column if not exists discount numeric(14,2) default 0,
  add column if not exists reimbursement numeric(14,2) default 0,
  add column if not exists special_request text,
  add column if not exists transferred_from_hotel uuid references hotels(id) on delete set null,
  add column if not exists is_repeat_customer boolean default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- Relax the status check to support the full lifecycle
do $$ begin
  alter table bookings drop constraint if exists bookings_status_check;
exception when others then null; end $$;

alter table bookings add constraint bookings_status_check
  check (status in ('pending','confirmed','active','upcoming','closed','cancelled'));

-- Payment status / mode constraints
do $$ begin
  alter table bookings add constraint bookings_payment_status_check
    check (payment_status in ('pending','paid','refunded','partial'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table bookings add constraint bookings_payment_mode_check
    check (payment_mode in ('prepaid','pay_at_hotel'));
exception when duplicate_object then null; end $$;

-- Derive a lifecycle status from dates for existing rows:
-- upcoming = check_in in future, active = currently staying, closed = checked out
update bookings set status = case
  when status = 'cancelled' then 'cancelled'
  when check_in > current_date then 'upcoming'
  when check_out < current_date then 'closed'
  else 'active'
end
where status in ('confirmed','active','upcoming','closed');
