# 5. localStorage → Supabase Migration Plan

Two migrations live here:
1. **Code migration** — already done: localStorage is now one adapter behind a
   shared interface; Supabase is the other. Nothing in the UI changed.
2. **Data migration** — moving any rows a user created in localStorage into their
   Supabase account on first login. Optional, opt-in, and safe.

## Phase 0 — Where we are now ✅

- `src/lib/data/localAdapter.ts` — the original localStorage store.
- `src/lib/data/supabaseAdapter.ts` — production store (cache + Realtime).
- `src/lib/data/index.ts` — selector; `src/lib/backend.ts` re-exports it.
- Default with no env = **local**. With Supabase env = **supabase**.

No component imports changed: they still `import { db } from "../lib/backend"`.

## Phase 1 — Stand up Supabase (no app risk)

1. Create a free Supabase project.
2. Run `supabase/schema.sql` then `supabase/policies.sql` in the SQL editor.
3. Enable Realtime for the four tables (see note at the bottom of `policies.sql`).
4. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to `.env.local`.
5. Wire Supabase Auth (see [auth-integration.md](./auth-integration.md)).

At this point new signups get a fresh seeded account in Postgres.

## Phase 2 — One-time local → cloud import (opt-in)

For early users who have demo/real data in localStorage, offer a **"Import local
data"** action (e.g. in Settings). It reads the local rows and bulk-inserts them
through the *active* (Supabase) adapter — which means it goes through RLS as the
signed-in user.

Reference helper (add as `src/lib/data/importLocal.ts` when needed):

```ts
import { db } from "../backend";
import type { Budget, Subscription, Transaction } from "../types";

const PREFIX = "clearfunds.v2";
function readLocal<T>(userId: string, entity: string): T[] {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}.${userId}.${entity}`) || "[]"); }
  catch { return []; }
}

// `localUserId` is the old mock id; `userId` is the new auth.uid().
export function importLocalInto(localUserId: string, userId: string) {
  const strip = <T,>(rows: T[]) =>
    rows.map(({ id, user_id, ...rest }: any) => rest);

  const txns = readLocal<Transaction>(localUserId, "transactions");
  const buds = readLocal<Budget>(localUserId, "budgets");
  const subs = readLocal<Subscription>(localUserId, "subscriptions");

  if (txns.length) db.transactions.bulkInsert(userId, strip(txns));
  if (buds.length)  db.budgets.bulkInsert(userId, strip(buds));
  if (subs.length)  db.subscriptions.bulkInsert(userId, strip(subs));
}
```

Notes:
- We **strip** old `id`/`user_id` so the cloud generates fresh UUIDs owned by the
  authenticated user (RLS-safe).
- Run it **once**, then set a flag (`clearfunds.v2.<id>.migrated`) so it can't
  double-import.
- Because seeding only runs when the account is empty, import *before* first load
  or skip seeding (`VITE_SEED_NEW_USERS=false`) for migrating users.

## Phase 3 — Cut over & clean up

- Default the deployed app to Supabase (env present → automatic).
- Keep the local adapter for development and offline demos.
- After a deprecation window, optionally clear local keys post-import.

## Rollback

Set `VITE_DATA_ADAPTER=local` (or remove the Supabase env vars) and redeploy —
the app instantly returns to the localStorage adapter. No data in Supabase is
touched.

## Field mapping reference

| Entity field | Postgres column |
|---|---|
| `budget.limit` | `budgets.monthly_limit` |
| `subscription.basePrice` | `subscriptions.base_price` |
| `subscription.currentPrice` | `subscriptions.current_price` |
| `subscription.lastPriceChangeAt` | `subscriptions.last_price_change_at` |
| `subscription.priceHistory` | `subscriptions.price_history` (jsonb) |
| everything else | identical snake/lower name |

The adapter's `toDb`/`fromDb` mappers (`supabaseAdapter.ts`) handle this both ways.
