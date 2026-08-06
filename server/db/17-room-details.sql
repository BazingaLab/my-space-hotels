alter table hotels
  add column if not exists bedrooms integer default 1,
  add column if not exists beds integer default 1,
  add column if not exists bathrooms integer default 1,
  add column if not exists max_guests integer default 4,
  add column if not exists house_rules text;

alter table pending_hotels
  add column if not exists bedrooms integer default 1,
  add column if not exists beds integer default 1,
  add column if not exists bathrooms integer default 1,
  add column if not exists max_guests integer default 4,
  add column if not exists house_rules text;