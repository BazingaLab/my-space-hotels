-- ============================================================
-- GUEST BOOKING MANAGEMENT — reviews table + cancellation policy.
-- Run in Supabase. Safe to re-run.
-- ============================================================

-- Reviews: one per booking, written by the guest after their stay.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(booking_id)  -- one review per booking
);
create index if not exists idx_reviews_hotel on reviews(hotel_id);

alter table reviews enable row level security;

-- Anyone can read reviews (public social proof)
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select using (true);

-- Authenticated users can insert their own review
drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert
  with check (auth.uid() = user_id);

-- Keep an aggregate rating + count on the hotel for quick display
alter table hotels
  add column if not exists rating_avg numeric(3,2) default 0,
  add column if not exists rating_count int default 0;

-- Cancellation policy window (hours before check-in that free cancellation allowed)
alter table hotels
  add column if not exists free_cancellation_hours int default 24;
