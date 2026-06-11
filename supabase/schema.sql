-- ============================================================
-- ClearFunds — Supabase database schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Free-tier friendly: plain Postgres, no extensions beyond pgcrypto.
--
-- Conventions:
--   * Every user-owned table has user_id uuid -> auth.users(id).
--   * RLS is enabled here; policies live in policies.sql.
--   * Column names are snake_case; the Supabase adapter maps the few
--     camelCase entity fields (budget.limit, subscription.basePrice, …).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text not null default 'ClearFunds User',
  email        text,
  plan         text not null default 'free' check (plan in ('free', 'pro')),
  avatar_color text default '#2563EB',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- transactions ----------
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  vendor          text not null default '',
  amount          numeric(12, 2) not null default 0,
  type            text not null check (type in ('income', 'expense')),
  category        text not null default 'Other',
  date            date not null default current_date,
  notes           text,
  source          text,
  bank_account    text,
  is_subscription boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---------- budgets ----------
create table if not exists public.budgets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  category       text not null,
  monthly_limit  numeric(12, 2) not null default 0,   -- entity field: `limit`
  month          text not null,                       -- 'YYYY-MM'
  icon           text not null default 'other',
  color          text not null default '#2563EB',
  alerts_enabled boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (user_id, category, month)
);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  name                 text not null,
  amount               numeric(12, 2) not null default 0,
  base_price           numeric(12, 2),
  current_price        numeric(12, 2),
  last_price_change_at timestamptz,
  price_history        jsonb not null default '[]'::jsonb,
  currency             text not null default 'USD',
  billing_cycle        text not null default 'monthly'
                         check (billing_cycle in ('weekly','monthly','quarterly','yearly')),
  next_billing_date    date,
  category             text not null default 'Subscriptions',
  status               text not null default 'active'
                         check (status in ('active','paused','canceled')),
  logo_url             text,
  usage_rating         smallint,
  cancellation_date    date,
  reminder_days        smallint default 3,
  last_known_price     numeric(12, 2),
  created_at           timestamptz not null default now()
);

-- ---------- user_insights ----------
create table if not exists public.user_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         text not null,
  data         jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

-- ---------- indexes (keep list queries fast) ----------
create index if not exists idx_transactions_user_date  on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_cat    on public.transactions (user_id, category);
create index if not exists idx_budgets_user_month       on public.budgets (user_id, month);
create index if not exists idx_subscriptions_user       on public.subscriptions (user_id, status);
create index if not exists idx_user_insights_user       on public.user_insights (user_id, type);

-- ---------- auto-update profiles.updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- create a profile row automatically on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#2563EB')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- enable Row Level Security (policies in policies.sql) ----------
alter table public.profiles       enable row level security;
alter table public.transactions   enable row level security;
alter table public.budgets        enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.user_insights  enable row level security;
