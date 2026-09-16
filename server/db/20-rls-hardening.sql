-- ============================================================
-- RLS HARDENING — closes gaps found in a security review of
-- 01-rls-policies.sql. Run in Supabase SQL Editor, after everything
-- already applied. Safe to re-run.
--
-- Context: the backend (Express) always uses the service_role key,
-- which bypasses RLS entirely — these policies only matter for
-- requests made directly against Supabase's REST API using the PUBLIC
-- anon key, which ships inside the client bundle and is not a secret.
-- Anyone can call that API directly with it, so any policy written
-- "using (true)" is effectively a public, unauthenticated endpoint —
-- intentional for genuinely public data (hotel listings), a real leak
-- otherwise.
--
-- 1. bookings_read was `using (true)` — the ENTIRE bookings table
--    (guest name/email/phone, stay dates, special requests, prices)
--    was readable by anyone with the anon key, logged in or not. The
--    app itself never queries bookings directly via supabase.from() —
--    every screen goes through the Express API, which does its own
--    ownership checks (see guestBookingController.ownsBooking). So
--    this policy provided zero functional benefit while exposing
--    every guest's PII. Tightened to: the booking's own account
--    holder, or staff.
--
-- 2. bookings_insert was `using (true)` (technically `with check
--    (true)`, insert's equivalent) — anyone could insert arbitrary
--    rows directly into bookings, bypassing pricing, hotel-existence
--    checks, and wallet crediting entirely. Real booking creation
--    always goes through the Express service-role path
--    (bookingController.createBooking / paymentController), which
--    bypasses RLS anyway — so client-side insert access is unused and
--    purely an abuse vector (fake/spam bookings). Restricted to staff.
--
-- 3. team_read allowed any authenticated user — including an ordinary
--    guest account — to read the full staff directory (names, emails,
--    phone numbers, regions, reporting lines). Nothing in the app
--    queries team_members directly (it goes through /api/team).
--    Tightened to staff only.
-- ============================================================

drop policy if exists bookings_read on bookings;
create policy bookings_read on bookings for select using (
  is_staff() or user_id = auth.uid()
);

drop policy if exists bookings_insert on bookings;
create policy bookings_insert on bookings for insert with check (is_staff());

drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (is_staff());
