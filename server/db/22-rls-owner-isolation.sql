-- ============================================================
-- RLS OWNER ISOLATION — closes a gap in 20-rls-hardening.sql itself.
-- Run in Supabase SQL Editor, after 20-rls-hardening.sql and
-- 21-financial-integrity.sql. Safe to re-run (drop-if-exists / create).
--
-- THE GAP: 20-rls-hardening.sql tightened bookings/team_members reads
-- from "anyone" to "is_staff() or the record's own user". But
-- is_staff() (defined in 01-rls-policies.sql) returns true for ANY
-- role in ('super_admin','hotel_admin','manager','cluster_manager',
-- 'ground_team') — it does not check WHICH hotel a hotel_admin owns.
-- So under the 20-rls-hardening.sql policies, a hotel_admin's own
-- authenticated session could read every hotel's bookings/complaints
-- directly via the public anon key + their session token, not just
-- their own hotel's. That's a real cross-tenant leak: hotel A's owner
-- could see hotel B's guest names, emails, phone numbers, stay dates.
--
-- No schema change is required to fix this — hotels.owner_id and each
-- table's hotel_id foreign key are already exactly what's needed to
-- express "does this row belong to a hotel I own." This migration
-- replaces every is_staff()-gated SELECT with an explicit ownership
-- check via that existing relationship.
--
-- Tables intentionally NOT touched here, with the reason why:
--  - hotels_read (public true) — intentional, hotel listings ARE public
--    marketing data.
--  - hotels_owner_update, photos_manage — already scoped by
--    `owner_id = auth.uid()` directly, never used is_staff().
--  - wallet_read, ledger_read — already scoped via
--    `exists (select 1 from hotels where hotels.id = ... and
--    hotels.owner_id = auth.uid())` — already correct, verified by
--    re-reading 01-rls-policies.sql; not modified.
--  - pending_read — already `owner_id = auth.uid() or is_super_admin()`
--    — already correct; not modified. There is also no UPDATE policy
--    on pending_hotels for anon/authenticated at all (default-deny),
--    so an owner already cannot approve their own submission directly
--    via the API even before this migration.
--  - kyc_owner_read — already `owner_id = auth.uid() or role in
--    (super_admin, manager, cluster_manager)` — note this deliberately
--    does NOT include hotel_admin in the staff bypass, so a hotel_admin
--    already only ever sees owner_id = auth.uid() (their own docs).
--    Already correct; not modified.
--  - bookings_insert, complaints_insert — write paths that always go
--    through the Express service_role in practice; left as-is.
--
-- Tables tightened here:
--  - bookings_read: hotel_admin restricted to bookings at hotels they
--    own, instead of every hotel's bookings.
--  - complaints_read / complaints_update: same restriction.
--  - team_members: is_staff() removed entirely — this is an internal
--    HR roster (ground_team/manager/cluster_manager), which a hotel
--    owner has no legitimate reason to read. super_admin only.
--  - customers: is_staff() removed entirely — this is a cross-hotel
--    CRM roll-up with no hotel_id at all, so there is no ownership
--    boundary to scope it by; a hotel_admin seeing it would mean
--    seeing every OTHER hotel's guests too. super_admin (or the
--    customer's own account) only — matches the Express
--    customerRoutes.js decision from the routing/auth phase.
-- ============================================================

-- ---- BOOKINGS ----
drop policy if exists bookings_read on bookings;
create policy bookings_read on bookings for select using (
  is_super_admin()
  or user_id = auth.uid()
  or exists (select 1 from hotels h where h.id = bookings.hotel_id and h.owner_id = auth.uid())
);

-- ---- COMPLAINTS ----
drop policy if exists complaints_read on complaints;
create policy complaints_read on complaints for select using (
  is_super_admin()
  or user_id = auth.uid()
  or exists (select 1 from hotels h where h.id = complaints.hotel_id and h.owner_id = auth.uid())
);

drop policy if exists complaints_update on complaints;
create policy complaints_update on complaints for update using (
  is_super_admin()
  or exists (select 1 from hotels h where h.id = complaints.hotel_id and h.owner_id = auth.uid())
);

-- ---- TEAM MEMBERS ----
drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (is_super_admin());

-- ---- CUSTOMERS ----
drop policy if exists customers_read on customers;
create policy customers_read on customers for select using (
  is_super_admin() or user_id = auth.uid()
);
