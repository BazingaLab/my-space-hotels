alter table bookings
  add column if not exists gst_rate numeric(5,2) default 0,
  add column if not exists gst_amount numeric(14,2) default 0,
  add column if not exists grand_total numeric(14,2);

-- Backfill so existing bookings don't show a null grand_total
update bookings set grand_total = total_price where grand_total is null;