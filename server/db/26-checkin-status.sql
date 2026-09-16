-- ============================================================
-- CHECK-IN / CHECK-OUT / NO-SHOW — missing columns.
--
-- WHY: bookingMgmtController.js (checkIn/checkOut/markNoShow) and
-- reviewController.js have referenced bookings.checkin_status,
-- checked_in_at and checked_out_at since they were written, but no
-- migration ever added these columns. Found via Phase 6 staging
-- verification: check-in/check-out/no-show all failed with
-- "Could not find the 'checked_in_at' column of 'bookings' in the
-- schema cache", and guest review submission (which requires
-- checkin_status = 'checked_out') could never succeed either. Purely
-- additive — safe to run against an existing table with live data.
-- ============================================================

alter table bookings
  add column if not exists checkin_status text not null default 'not_arrived'
    check (checkin_status in ('not_arrived', 'checked_in', 'checked_out', 'no_show')),
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz;
