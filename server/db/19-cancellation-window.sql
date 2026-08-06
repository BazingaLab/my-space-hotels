-- Default of 24 matches the hardcoded fallback that guestBookingController.js
-- has been silently using for every hotel (via `?? 24`) — so this migration
-- changes nothing about how any existing hotel behaves. It just replaces
-- "the code is guessing" with "the code is reading a real, settable value."
alter table hotels
  add column if not exists free_cancellation_hours integer default 24;

alter table pending_hotels
  add column if not exists free_cancellation_hours integer default 24;