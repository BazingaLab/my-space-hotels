-- ============================================================
-- CRM BACKFILL — populate customers from existing bookings
-- Run AFTER 00-master-schema.sql. Safe to re-run.
-- ============================================================
insert into customers (name, email, phone, total_bookings, total_spent, classification, loyalty_points)
select
  max(guest_name) as name,
  lower(trim(guest_email)) as email,
  max(guest_phone) as phone,
  count(*) filter (where status <> 'cancelled') as total_bookings,
  coalesce(sum(total_price) filter (where status <> 'cancelled'), 0) as total_spent,
  case
    when count(*) filter (where status <> 'cancelled') >= 10
      or coalesce(sum(total_price) filter (where status <> 'cancelled'),0) >= 100000 then 'Premium'
    when count(*) filter (where status <> 'cancelled') >= 3
      or coalesce(sum(total_price) filter (where status <> 'cancelled'),0) >= 25000 then 'Regular'
    else 'Basic'
  end as classification,
  floor(coalesce(sum(total_price) filter (where status <> 'cancelled'),0) / 100) as loyalty_points
from bookings
where guest_email is not null
group by lower(trim(guest_email))
on conflict (email) do update set
  total_bookings = excluded.total_bookings,
  total_spent = excluded.total_spent,
  classification = excluded.classification,
  loyalty_points = excluded.loyalty_points;

-- link bookings to customers
update bookings b set customer_id = c.id
from customers c
where lower(trim(b.guest_email)) = c.email and b.customer_id is null;
