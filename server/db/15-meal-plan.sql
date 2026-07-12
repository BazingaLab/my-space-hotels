alter table hotels
  add column if not exists breakfast_available boolean default false,
  add column if not exists breakfast_price numeric(10,2) default 0;

alter table bookings
  add column if not exists meal_plan text default 'room_only'
    check (meal_plan in ('room_only', 'breakfast_included')),
  add column if not exists breakfast_price_applied numeric(10,2) default 0;