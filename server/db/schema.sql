-- ============================================================
-- My Space Hotels — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- HOTELS TABLE
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  country text default 'India',
  description text not null,
  short_description text,
  images text[] default '{}',
  cover_image text not null,
  price numeric not null,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  review_count int default 0,
  tag text default 'Boutique' check (tag in ('Heritage', 'Beachfront', 'Luxury', 'Boutique', 'Mountain', 'City')),
  amenities text[] default '{}',
  rooms int default 1,
  featured boolean default false,
  available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_hotels_city on hotels(city);
create index if not exists idx_hotels_featured on hotels(featured);
create index if not exists idx_hotels_price on hotels(price);

-- BOOKINGS TABLE
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  guests int default 2,
  nights int not null,
  total_price numeric not null,
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz default now()
);

create index if not exists idx_bookings_email on bookings(guest_email);
create index if not exists idx_bookings_hotel on bookings(hotel_id);

-- ENABLE ROW LEVEL SECURITY (recommended)
alter table hotels enable row level security;
alter table bookings enable row level security;

-- Public read access for hotels
create policy "Anyone can read hotels"
  on hotels for select
  using (true);

-- Service role bypasses RLS, so backend can write
-- (no public insert/update policies on purpose)

-- Allow public to create bookings (write-only for anon)
create policy "Anyone can create bookings"
  on bookings for insert
  with check (true);

create policy "Users can read their own bookings by email"
  on bookings for select
  using (true); -- in production, lock this down with auth.uid()
