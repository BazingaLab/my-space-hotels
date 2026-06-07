-- ============================================================
-- TEAM MEMBERS — staff hierarchy: ground_team / manager / cluster_manager
-- Run in Supabase. Safe to re-run.
-- ============================================================
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,  -- optional link to a login account
  name text not null,
  email text,
  phone text,
  team_role text not null default 'ground_team'
    check (team_role in ('ground_team','manager','cluster_manager')),
  region text,                          -- city/zone they cover
  reports_to uuid references team_members(id) on delete set null,  -- hierarchy
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_team_role on team_members(team_role);
create index if not exists idx_team_active on team_members(is_active);

alter table team_members enable row level security;

-- super admin manages everyone; staff can read the roster
drop policy if exists team_read on team_members;
create policy team_read on team_members for select using (auth.role() = 'authenticated');
-- writes go through the backend service role (bypasses RLS)
