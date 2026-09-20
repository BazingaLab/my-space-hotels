-- ============================================================
-- PREPAID CHECK-IN TOKEN — Phase 8A (tracker #11: "Generate token on
-- prepaid; show at check-in").
--
-- Purely additive. checkin_token is generated once, when a PREPAID
-- booking's payment is confirmed (paymentController.onBookingConfirmed).
-- checkin_token_verified_at records when front desk verified it — an
-- audit trail, not a separate reuse guard: reuse is already prevented by
-- the EXISTING checkin_status state machine (bookingMgmtController.checkIn
-- only ever transitions a booking OUT of 'not_arrived' once), so a token
-- can't be "used twice" in any way that matters — the booking it belongs
-- to can only be checked in once regardless.
-- ============================================================

alter table bookings
  add column if not exists checkin_token text,
  add column if not exists checkin_token_verified_at timestamptz;
