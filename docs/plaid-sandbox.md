# 6. Plaid Sandbox Integration Plan

Bank connectivity is built **Sandbox-first** and entirely behind Supabase Edge
Functions, so Plaid secrets and access tokens never reach the browser. Production
Plaid is the same code with different keys.

## Why Edge Functions (not the frontend)

Plaid's `client_secret` and per-item `access_token` are **server-only**. The
browser only ever handles a short-lived `link_token` (to open Plaid Link) and a
one-time `public_token` (to hand back for exchange). Everything sensitive stays in
the Edge Function trust boundary.

## Pieces (already scaffolded)

| File | Role |
|---|---|
| `supabase/functions/plaid-link-token/` | Create a Sandbox Link token for the user |
| `supabase/functions/plaid-exchange-token/` | Swap `public_token` → `access_token`, store server-side |
| `supabase/functions/plaid-sync-transactions/` | Pull transactions via `/transactions/sync`, upsert to `transactions` |
| `supabase/functions/_shared/cors.ts` | Shared CORS + JSON helper |

These are **implemented** and wired to the UI (`ConnectBankButton` in the
Dashboard Accounts card + Settings). Deploy them and set secrets to go live.

## Database (run `supabase/plaid.sql`)

`supabase/plaid.sql` is idempotent and creates/aligns everything the functions
need: `accounts`, `plaid_items` (RLS on, **no policies** → access_token is never
client-readable), `plaid_transactions_sync_log`, the `plaid_transaction_id` /
`account_id` columns on `transactions`, the unique constraints used by upserts,
an `accounts_select_own` RLS policy, and Realtime on `accounts`.

## Setup steps

1. Create a free Plaid account → get **Sandbox** `client_id` + `secret`.
2. Store them as Edge secrets (never in the frontend):
   ```bash
   supabase secrets set PLAID_CLIENT_ID=xxx PLAID_SECRET=xxx PLAID_ENV=sandbox
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
   injected into functions automatically.
3. Deploy:
   ```bash
   supabase functions deploy plaid-link-token
   supabase functions deploy plaid-exchange-token
   supabase functions deploy plaid-sync-transactions
   ```
4. Run the `plaid_items` SQL above.

## Frontend flow (later phase, ~30 lines)

```
[Connect bank]  ──▶ invoke plaid-link-token ──▶ get link_token
     │
     ▼ open Plaid Link (react-plaid-link) with link_token
 user picks sandbox bank (user_good / pass_good)
     │
     ▼ onSuccess(public_token) ──▶ invoke plaid-exchange-token
     │
     ▼ invoke plaid-sync-transactions ──▶ rows land in `transactions`
                                          (Realtime updates the dashboard)
```

Because synced transactions are written to the **same `transactions` table** the
app already reads, the dashboard, budgets, and insights light up with zero extra
UI work — the Supabase adapter's Realtime subscription refreshes the cache.

## Sandbox test credentials

- Institution: any (e.g. "First Platypus Bank").
- Username `user_good`, password `pass_good`.
- Use `/sandbox/public_token/create` for fully scripted tests if preferred.

## Mapping Plaid → ClearFunds transaction

| Plaid field | ClearFunds column |
|---|---|
| `name` | `title` |
| `merchant_name` ?? `name` | `vendor` |
| `abs(amount)` | `amount` |
| `amount < 0 ? income : expense` | `type` |
| `personal_finance_category.primary` | `category` |
| `date` | `date` |
| `"Plaid"` | `source` |
| `account_id` | `bank_account` |

(See `plaid-sync-transactions/index.ts`.) You may later normalize Plaid's
category taxonomy onto ClearFunds' category set in `src/lib/categories.ts`.

## Going to Production

1. Apply for Plaid Production access.
2. `supabase secrets set PLAID_ENV=production PLAID_SECRET=<prod secret>`.
3. No code change — the functions read `PLAID_ENV` to pick the base URL.

The Settings page already shows a **Plaid connection management placeholder**; wire
the button to `plaid-link-token` when this phase begins.
