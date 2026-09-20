-- ============================================================
-- HOTEL GEOLOCATION COLUMNS — Phase 8A.
--
-- WHY: client/src/features/hotels/HotelOnboardingForm.jsx has sent
-- latitude/longitude in every hotel create/update request since the
-- LocationPicker UI was added, and adminController.js's
-- adminCreateHotel/adminUpdateHotel spread the request body straight
-- into the Supabase insert/update with no column whitelist. Since
-- these columns never existed, EVERY hotel create/update through the
-- admin onboarding form has been failing outright with a PostgREST
-- "column not found" error (PGRST204) — confirmed empirically against
-- staging before writing this migration. This also explains why the
-- existing guest-facing map on HotelDetail.jsx ("Where you'll be")
-- never renders for any hotel: hotel.latitude/longitude were always
-- undefined. Same code exists on main — production is very likely
-- affected the same way, though not verified (never touched).
--
-- Purely additive: two nullable numeric columns. No existing data or
-- behavior is affected for hotels that don't have a location set yet.
-- ============================================================

alter table hotels
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;
