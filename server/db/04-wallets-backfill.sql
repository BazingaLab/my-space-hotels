-- ============================================================
-- WALLETS BACKFILL — run after 00-master-schema.sql
-- Creates a wallet for every hotel, credits past (non-cancelled)
-- bookings net of commission. Safe to re-run (skips already-credited bookings).
-- ============================================================

-- 1. Ensure every hotel has a wallet
insert into wallet_accounts (hotel_id, balance_cached, initial_balance)
select h.id, 0, 0 from hotels h
where not exists (select 1 from wallet_accounts w where w.hotel_id = h.id);

-- link wallet_id back to hotels
update hotels h set wallet_id = w.id
from wallet_accounts w where w.hotel_id = h.id and (h.wallet_id is null or h.wallet_id <> w.id);

-- 2. Credit past bookings that aren't already in the ledger
insert into ledger_entries (wallet_id, amount, direction, ref_type, ref_id, description, balance_after)
select
  w.id,
  round(b.total_price * (1 - coalesce(h.commission_percent,0)/100.0), 2),
  'credit', 'booking', b.id,
  'Backfill booking ' || left(b.id::text, 8),
  0  -- balance_after fixed up below
from bookings b
join hotels h on h.id = b.hotel_id
join wallet_accounts w on w.hotel_id = b.hotel_id
where b.status <> 'cancelled'
  and not exists (select 1 from ledger_entries le where le.ref_type='booking' and le.ref_id = b.id);

-- 3. Recompute cached balances and running balance_after
with running as (
  select id, wallet_id,
    sum(case when direction='credit' then amount else -amount end)
      over (partition by wallet_id order by created_at, id rows between unbounded preceding and current row) as bal
  from ledger_entries
)
update ledger_entries le set balance_after = r.bal
from running r where r.id = le.id;

update wallet_accounts w set balance_cached = coalesce((
  select sum(case when direction='credit' then amount else -amount end)
  from ledger_entries le where le.wallet_id = w.id), 0);
