# ClearFunds — Backend Independence & Deployment Docs

ClearFunds is a **fully owned, independently deployable** app built on free-tier
infrastructure first. No Base44. No vendor lock-in beyond swappable adapters.

| # | Deliverable | Doc |
|---|-------------|-----|
| 1 | Free-tier architecture plan | [architecture.md](./architecture.md) |
| 2 | Supabase database schema | [`../supabase/schema.sql`](../supabase/schema.sql) |
| 3 | RLS policies | [`../supabase/policies.sql`](../supabase/policies.sql) |
| 4 | Supabase Auth integration plan | [auth-integration.md](./auth-integration.md) |
| 5 | localStorage → Supabase migration plan | [migration-localstorage-to-supabase.md](./migration-localstorage-to-supabase.md) |
| 6 | Plaid Sandbox integration plan | [plaid-sandbox.md](./plaid-sandbox.md) |
| 7 | Stripe future monetization plan | [stripe-monetization.md](./stripe-monetization.md) |
| 8 | Vercel deployment checklist | [vercel-deployment.md](./vercel-deployment.md) |
| 9 | Environment variable checklist | [environment-variables.md](./environment-variables.md) |
| 10 | Supabase adapter (replaces localStorage, no UI change) | [`../src/lib/data/`](../src/lib/data) |

## The one idea that makes this work

The UI **only ever imports from `src/lib/backend.ts`**, which re-exports whichever
adapter the selector chose at runtime:

```
UI components ─▶ src/lib/backend.ts ─▶ src/lib/data/index.ts (selector)
                                          ├─ localAdapter   (dev default)
                                          └─ supabaseAdapter (production)
```

- **No env configured** → localStorage adapter (zero-config dev).
- **Supabase env present** → Supabase adapter, automatically.
- `VITE_DATA_ADAPTER=local|supabase` forces a choice.

Both adapters implement the same synchronous `DataAdapter` interface
(`src/lib/data/types.ts`), so **not a single component changes** when you switch.
The Supabase adapter keeps an in-memory cache (hydrated on login, kept fresh via
Realtime) so the UI's synchronous `db.x.list()` calls keep working unchanged.
