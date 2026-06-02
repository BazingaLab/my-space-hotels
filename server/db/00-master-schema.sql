-- ============================================================
-- MY SPACE HOTELS — MASTER SCHEMA (run once, in order)
-- Safe to re-run: uses "if not exists" / "or replace" throughout
-- ============================================================

-- ============ HOTELS (full ERP column set) ============
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  country text default 'India',
  description text,
  short_description text,
  images text[] default '{}',
  cover_image text,
  price numeric not null default 0,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  review_count int default 0,
  tag text default 'Boutique',
  amenities text[] default '{}',
  rooms int default 1,
  featured boolean default false,
  available boolean default true,
  -- ERP / onboarding columns (from requirements doc)
  hotel_type text check (hotel_type in ('Budget','Premium','Resort')),
  owner_name text,
  contact_number text,
  owner_email text,
  gst_number text,
  pan_number text,
  property_address text,
  pincode text,
  google_map_link text,
  checkin_time time,
  checkout_time time,
  agreement_start_date date,
  agreement_end_date date,
  commission_percent numeric(5,2) default 0,
  bank_details jsonb,
  hotel_status text default 'active' check (hotel_status in ('active','inactive')),
  wallet_id uuid,
  uploaded_by uuid,
  referred_by uuid,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_hotels_city on hotels(city);
create index if not exists idx_hotels_featured on hotels(featured);
create index if not exists idx_hotels_owner on hotels(owner_id);

-- ============ USER ROLES (RBAC) ============
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'guest' check (role in ('guest','hotel_admin','super_admin','manager','cluster_manager','ground_team')),
  created_at timestamptz default now(),
  unique(user_id)
);

-- ============ CUSTOMERS (CRM) ============
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  address text,
  id_proof_type text check (id_proof_type in ('Aadhaar','Passport','DrivingLicense','VoterID','Other')),
  id_proof_number text,
  loyalty_points int default 0,
  classification text default 'Basic' check (classification in ('Basic','Regular','Premium')),
  feedback_rating numeric(3,2) default 0,
  total_bookings int default 0,
  total_spent numeric(14,2) default 0,
  created_at timestamptz default now(),
  unique(email)
);
create index if not exists idx_customers_email on customers(email);

-- ============ BOOKINGS (full lifecycle) ============
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  guests int default 2,
  nights int not null,
  total_price numeric not null,
  -- lifecycle
  status text default 'confirmed' check (status in ('pending','confirmed','active','upcoming','closed','cancelled')),
  payment_status text default 'pending' check (payment_status in ('pending','paid','refunded','partial')),
  payment_mode text default 'pay_at_hotel' check (payment_mode in ('prepaid','pay_at_hotel')),
  discount numeric(14,2) default 0,
  reimbursement numeric(14,2) default 0,
  special_request text,
  transferred_from_hotel uuid references hotels(id) on delete set null,
  is_repeat_customer boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_bookings_email on bookings(guest_email);
create index if not exists idx_bookings_hotel on bookings(hotel_id);
create index if not exists idx_bookings_status on bookings(status);

-- ============ PENDING HOTELS (owner submissions) ============
create table if not exists pending_hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text, state text, description text,
  price numeric, rooms int, tag text,
  cover_image text, images text[] default '{}',
  amenities text[] default '{}',
  hotel_type text, contact_number text, property_address text,
  pincode text, google_map_link text,
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text, owner_name text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz default now()
);

-- ============ COMPLAINTS ============
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_id text,
  guest_name text,
  issue_type text,
  hotel_name text,
  hotel_id uuid references hotels(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_team_member uuid references auth.users(id) on delete set null,
  resolution_status text default 'open' check (resolution_status in ('open','in_progress','resolved','closed')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent','critical')),
  notes text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_complaints_status on complaints(resolution_status);

-- ============ HOTEL PHOTOS (categorized gallery) ============
create table if not exists hotel_photos (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  url text not null,
  category text not null default 'other' check (category in ('cover','front','bedroom','bathroom','pool','dining','amenities','lobby','exterior','gallery','other')),
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_hotel_photos_hotel on hotel_photos(hotel_id);

-- ============ WALLETS + LEDGER (double-entry) ============
create table if not exists wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  initial_balance numeric(14,2) default 0,
  balance_cached numeric(14,2) default 0,
  currency text default 'INR',
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(hotel_id)
);
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references wallet_accounts(id) on delete cascade not null,
  amount numeric(14,2) not null check (amount > 0),
  direction text not null check (direction in ('credit','debit')),
  ref_type text not null,
  ref_id uuid,
  utr_number text,
  description text,
  balance_after numeric(14,2) not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_ledger_wallet on ledger_entries(wallet_id, created_at desc);

-- ============ AUDIT LOGS ============
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_audit_entity on audit_logs(entity_type, entity_id, created_at desc);

-- ============ updated_at trigger for hotels ============
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_hotels_updated on hotels;
create trigger trg_hotels_updated before update on hotels
  for each row execute function set_updated_at();
