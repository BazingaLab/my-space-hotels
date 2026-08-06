-- In case hotels.rating / hotels.review_count don't already exist —
-- harmless no-op if they do.
alter table hotels
  add column if not exists rating numeric(2,1) default 0,
  add column if not exists review_count integer default 0;