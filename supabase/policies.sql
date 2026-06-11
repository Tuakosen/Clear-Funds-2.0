-- ============================================================
-- ClearFunds — Row Level Security policies
-- Run AFTER schema.sql. Every row is private to its owner: a user
-- can only ever read or write rows where user_id = auth.uid().
-- This is the security backbone — the anon key is public, RLS is not.
-- ============================================================

-- ---------- profiles: a user manages only their own profile ----------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------- generic owner policies for user-data tables ----------
-- transactions
drop policy if exists "transactions_rw_own" on public.transactions;
create policy "transactions_rw_own" on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- budgets
drop policy if exists "budgets_rw_own" on public.budgets;
create policy "budgets_rw_own" on public.budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- subscriptions
drop policy if exists "subscriptions_rw_own" on public.subscriptions;
create policy "subscriptions_rw_own" on public.subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_insights
drop policy if exists "user_insights_rw_own" on public.user_insights;
create policy "user_insights_rw_own" on public.user_insights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Notes
-- * `for all` covers select/insert/update/delete with one policy.
--   `using` gates the rows a user can see/modify; `with check` gates
--   the rows they can write — both pinned to auth.uid() = user_id.
-- * Realtime respects RLS, so postgres_changes only stream a user's
--   own rows. Enable Realtime for these tables in the dashboard
--   (Database -> Replication) or:
--     alter publication supabase_realtime add table
--       public.transactions, public.budgets,
--       public.subscriptions, public.user_insights;
-- ============================================================
