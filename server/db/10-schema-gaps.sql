-- ============================================================
-- SCHEMA GAPS — brings the DB up to what the app code actually
-- expects. 00-master-schema.sql never absorbed everything from
-- 03/05/06/08 (below), and kyc_documents was never migrated at
-- all until now. Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

-- ---- bookings.user_id (from 03-bookings-user-id.sql) ----
alter table bookings add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_bookings_user on bookings(user_id);

-- ---- bookings lifecycle columns (from 05-booking-lifecycle.sql) ----
alter table bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

-- ---- hotels: reviews + cancellation policy (from 08-reviews-and-guest-mgmt.sql) ----
alter table hotels
  add column if not exists rating_avg numeric(3,2) default 0,
  add column if not exists rating_count int default 0,
  add column if not exists free_cancellation_hours int default 24;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(booking_id)
);
create index if not exists idx_reviews_hotel on reviews(hotel_id);

alter table reviews enable row level security;
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select using (true);
drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert with check (auth.uid() = user_id);

-- ---- team_members (from 06-team-members.sql) ----
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  team_role text not null default 'ground_team'
    check (team_role in ('ground_team','manager','cluster_manager')),
  region text,
  reports_to uuid references team_members(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_team_role on team_members(team_role);
create index if not exists idx_team_active on team_members(is_active);

alter table team_members enable row level security;
drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (auth.role() = 'authenticated');

-- ---- KYC (new — this schema never existed as a migration before,
--      inferred from controllers/kycController.js's actual reads/writes) ----
alter table hotels
  add column if not exists kyc_status text default 'pending'
    check (kyc_status in ('pending','verified','rejected'));

create table if not exists kyc_documents (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete set null,
  doc_type text not null,
  file_url text not null,
  file_name text,
  file_size bigint,
  status text default 'pending' check (status in ('pending','verified','rejected')),
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique(hotel_id, doc_type)
);
create index if not exists idx_kyc_hotel on kyc_documents(hotel_id);
create index if not exists idx_kyc_status on kyc_documents(status);

alter table kyc_documents enable row level security;
drop policy if exists kyc_owner_read on kyc_documents;
create policy kyc_owner_read on kyc_documents for select using (
  owner_id = auth.uid() or exists (
    select 1 from user_roles where user_id = auth.uid()
      and role in ('super_admin','manager','cluster_manager')
  )
);