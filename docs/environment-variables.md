# 9. Environment Variable Checklist

Copy `.env.example` → `.env.local` for dev. Set the `VITE_*` vars in Vercel for
prod. Set server-only secrets with `supabase secrets set` — **never** in the
frontend or Vercel.

## Frontend / public (`VITE_` prefix — shipped to the browser)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Prod | — | Supabase project URL. Presence switches app to the Supabase adapter. |
| `VITE_SUPABASE_ANON_KEY` | Prod | — | Public anon key. Safe to expose; **RLS** protects data. |
| `VITE_DATA_ADAPTER` | No | auto | `local` or `supabase` to force the adapter. Omit to auto-select. |
| `VITE_SEED_NEW_USERS` | No | `true` | `false` disables demo seeding for new Supabase users. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Later | — | Stripe publishable key. Unused at MVP. |

> Safe to be public: Supabase URL, Supabase **anon** key, Stripe **publishable**
> key. These are designed to live in client code.

## Server-only secrets (Supabase Edge Function secrets — NEVER in frontend)

| Secret | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | all functions | Auto-injected. |
| `SUPABASE_ANON_KEY` | all functions | Auto-injected (acts as the caller). |
| `SUPABASE_SERVICE_ROLE_KEY` | exchange/sync, webhooks | Auto-injected. Bypasses RLS — keep server-side only. |
| `PLAID_CLIENT_ID` | plaid-* | From Plaid dashboard. |
| `PLAID_SECRET` | plaid-* | Sandbox secret first, then production. |
| `PLAID_ENV` | plaid-* | `sandbox` → `production`. |
| `STRIPE_SECRET_KEY` | stripe-* (later) | `sk_...`. |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (later) | `whsec_...`. |

Set them:
```bash
supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
# later:
supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
```

## Quick decision rule

- **Does the browser need it to render or call an API directly?** → `VITE_` var.
- **Is it a secret that could read/write any user's data or move money?** →
  Edge Function secret. Never `VITE_`, never in Vercel client env.

## Verifying locally

```bash
# Pure local dev (no Supabase) — default:
#   leave Supabase vars blank → app uses localStorage adapter.

# Run against Supabase:
echo 'VITE_SUPABASE_URL=https://xxxx.supabase.co' >> .env.local
echo 'VITE_SUPABASE_ANON_KEY=eyJ...' >> .env.local
npm run dev
# In the browser console: the active backend is exported as `dataBackend`.
```

`.env.local` is gitignored (`.env.*`). Only `.env.example` is committed.
