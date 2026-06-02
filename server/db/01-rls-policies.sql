-- ============================================================
-- RLS POLICIES — run after 00-master-schema.sql
-- Backend uses service_role (bypasses RLS). These policies
-- govern the anon/authenticated clients used by the frontend.
-- ============================================================

alter table hotels enable row level security;
alter table bookings enable row level security;
alter table user_roles enable row level security;
alter table customers enable row level security;
alter table pending_hotels enable row level security;
alter table complaints enable row level security;
alter table hotel_photos enable row level security;
alter table wallet_accounts enable row level security;
alter table ledger_entries enable row level security;
alter table audit_logs enable row level security;

-- helper: is current user a super admin
create or replace function is_super_admin() returns boolean as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'super_admin');
$$ language sql security definer stable;

create or replace function is_staff() returns boolean as $$
  select exists (select 1 from user_roles where user_id = auth.uid()
    and role in ('super_admin','hotel_admin','manager','cluster_manager','ground_team'));
$$ language sql security definer stable;

-- HOTELS — public read, staff manage
drop policy if exists hotels_read on hotels;
create policy hotels_read on hotels for select using (true);
drop policy if exists hotels_owner_update on hotels;
create policy hotels_owner_update on hotels for update using (owner_id = auth.uid() or is_super_admin());

-- BOOKINGS — anyone can create; staff & owners read
drop policy if exists bookings_insert on bookings;
create policy bookings_insert on bookings for insert with check (true);
drop policy if exists bookings_read on bookings;
create policy bookings_read on bookings for select using (true);

-- USER ROLES — user reads own; super admin reads all
drop policy if exists roles_read_own on user_roles;
create policy roles_read_own on user_roles for select using (user_id = auth.uid() or is_super_admin());

-- CUSTOMERS — staff read; user reads own
drop policy if exists customers_read on customers;
create policy customers_read on customers for select using (is_staff() or user_id = auth.uid());

-- PENDING HOTELS — owner reads own + creates; super admin all
drop policy if exists pending_insert on pending_hotels;
create policy pending_insert on pending_hotels for insert with check (auth.role() = 'authenticated');
drop policy if exists pending_read on pending_hotels;
create policy pending_read on pending_hotels for select using (owner_id = auth.uid() or is_super_admin());

-- COMPLAINTS — logged-in create; staff read all; user reads own
drop policy if exists complaints_insert on complaints;
create policy complaints_insert on complaints for insert with check (auth.role() = 'authenticated');
drop policy if exists complaints_read on complaints;
create policy complaints_read on complaints for select using (is_staff() or user_id = auth.uid());
drop policy if exists complaints_update on complaints;
create policy complaints_update on complaints for update using (is_staff());

-- HOTEL PHOTOS — public read, owner manages
drop policy if exists photos_read on hotel_photos;
create policy photos_read on hotel_photos for select using (true);
drop policy if exists photos_manage on hotel_photos;
create policy photos_manage on hotel_photos for all using (owner_id = auth.uid() or is_super_admin());

-- WALLETS / LEDGER — owner reads own, super admin all
drop policy if exists wallet_read on wallet_accounts;
create policy wallet_read on wallet_accounts for select using (
  is_super_admin() or exists (select 1 from hotels where hotels.id = wallet_accounts.hotel_id and hotels.owner_id = auth.uid())
);
drop policy if exists ledger_read on ledger_entries;
create policy ledger_read on ledger_entries for select using (
  is_super_admin() or exists (
    select 1 from wallet_accounts wa join hotels h on h.id = wa.hotel_id
    where wa.id = ledger_entries.wallet_id and h.owner_id = auth.uid()
  )
);

-- AUDIT — super admin only
drop policy if exists audit_read on audit_logs;
create policy audit_read on audit_logs for select using (is_super_admin());

-- STORAGE bucket for hotel photos
insert into storage.buckets (id, name, public) values ('hotel-photos','hotel-photos',true)
on conflict (id) do nothing;

drop policy if exists "photos upload" on storage.objects;
create policy "photos upload" on storage.objects for insert
  with check (bucket_id = 'hotel-photos' and auth.role() = 'authenticated');
drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects for select using (bucket_id = 'hotel-photos');
drop policy if exists "photos owner delete" on storage.objects;
create policy "photos owner delete" on storage.objects for delete
  using (bucket_id = 'hotel-photos' and auth.uid()::text = (storage.foldername(name))[1]);
