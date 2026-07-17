alter table hotels
  add column if not exists hourly_available boolean default false,
  add column if not exists hourly_price_4h numeric(10,2) default 0,
  add column if not exists hourly_price_6h numeric(10,2) default 0;

alter table bookings
  add column if not exists booking_type text default 'nightly' check (booking_type in ('nightly','hourly')),
  add column if not exists slot_hours int,
  add column if not exists checkin_datetime timestamptz,
  add column if not exists checkout_datetime timestamptz;

create index if not exists idx_bookings_checkin_datetime on bookings(checkin_datetime);