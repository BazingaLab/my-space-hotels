-- ============================================================
-- Link bookings to logged-in user accounts (Option A)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
alter table bookings add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_bookings_user on bookings(user_id);
