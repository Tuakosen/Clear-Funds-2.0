-- ============================================================
-- ClearFunds — Plaid integration schema (run after schema.sql/policies.sql)
-- Idempotent: safe to run on top of existing tables. Aligns the columns,
-- constraints, and RLS the Edge Functions + app require.
-- ============================================================
create extension if not exists "pgcrypto";

-- ---------- accounts (read by the app, written by Edge Functions) ----------
create table if not exists public.accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  plaid_account_id  text not null,
  item_id           text,
  name              text not null default 'Account',
  official_name     text,
  mask              text,
  type              text,
  subtype           text,
  current_balance   numeric(14, 2) not null default 0,
  available_balance numeric(14, 2),
  currency          text default 'USD',
  institution       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.accounts add column if not exists plaid_account_id text;
alter table public.accounts add column if not exists item_id text;
alter table public.accounts add column if not exists official_name text;
alter table public.accounts add column if not exists mask text;
alter table public.accounts add column if not exists type text;
alter table public.accounts add column if not exists subtype text;
alter table public.accounts add column if not exists current_balance numeric(14,2) not null default 0;
alter table public.accounts add column if not exists available_balance numeric(14,2);
alter table public.accounts add column if not exists currency text default 'USD';
alter table public.accounts add column if not exists institution text;
alter table public.accounts add column if not exists last_synced_at timestamptz;

-- ---------- plaid_items (access_token never leaves the server) ----------
create table if not exists public.plaid_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  item_id      text not null,
  access_token text not null,
  institution  text,
  sync_cursor  text,
  created_at   timestamptz not null default now()
);
alter table public.plaid_items add column if not exists sync_cursor text;
alter table public.plaid_items add column if not exists institution text;

-- ---------- plaid sync log (optional, for diagnostics) ----------
create table if not exists public.plaid_transactions_sync_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  imported        integer not null default 0,
  accounts_synced integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ---------- transactions: Plaid linkage columns ----------
alter table public.transactions add column if not exists plaid_transaction_id text;
alter table public.transactions add column if not exists account_id text;

-- ---------- unique constraints (needed for upsert onConflict) ----------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'accounts_plaid_account_id_key') then
    alter table public.accounts add constraint accounts_plaid_account_id_key unique (plaid_account_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'plaid_items_item_id_key') then
    alter table public.plaid_items add constraint plaid_items_item_id_key unique (item_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_plaid_txn_key') then
    alter table public.transactions add constraint transactions_plaid_txn_key unique (plaid_transaction_id);
  end if;
end $$;

create index if not exists idx_accounts_user on public.accounts (user_id);
create index if not exists idx_plaid_items_user on public.plaid_items (user_id);

-- ---------- RLS ----------
alter table public.accounts                     enable row level security;
alter table public.plaid_items                   enable row level security;
alter table public.plaid_transactions_sync_log   enable row level security;

-- Users may READ their own accounts (the app renders them). Writes happen only
-- via the service-role key inside Edge Functions, so no client write policy.
drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);

-- Users may read their own sync log (no write policy → service role only).
drop policy if exists "sync_log_select_own" on public.plaid_transactions_sync_log;
create policy "sync_log_select_own" on public.plaid_transactions_sync_log
  for select using (auth.uid() = user_id);

-- IMPORTANT: plaid_items has RLS enabled and NO policies → the client (anon key)
-- can never read access_token. Only the service-role key (Edge Functions) can.

-- ---------- Realtime: live-update the Accounts card after a sync ----------
do $$ begin
  begin
    alter publication supabase_realtime add table public.accounts;
  exception when duplicate_object then null;
  end;
end $$;
