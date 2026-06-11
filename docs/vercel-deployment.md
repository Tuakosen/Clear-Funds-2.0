# 8. Vercel Deployment Checklist

ClearFunds is a static Vite SPA → deploys to Vercel's free Hobby tier.

## Repo is deploy-ready

- `vercel.json` — framework `vite`, output `dist`, **SPA rewrites** so client
  routes (`/app`, `/features/...`) don't 404 on refresh, plus immutable caching
  for hashed `/assets`.
- `npm run build` → `tsc -b && vite build` → `dist/`.

## One-time setup

- [ ] Push the repo to GitHub (already on `tuakosen/clear-funds-2.0`).
- [ ] In Vercel → **New Project** → import the repo.
- [ ] Framework preset: **Vite** (auto-detected). Build `npm run build`,
      output `dist` (already in `vercel.json`).
- [ ] Add environment variables (Production + Preview) — see below.
- [ ] Deploy.

## Environment variables (Vercel → Settings → Environment Variables)

Frontend (safe, public) — set for **Production** and **Preview**:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<anon public key>` |
| `VITE_DATA_ADAPTER` | *(omit — auto-selects supabase when the two above are set)* |
| `VITE_SEED_NEW_USERS` | `true` (or `false` to disable demo seeding) |

> **Never** put service-role keys, Plaid secrets, or Stripe secret keys in Vercel
> env. Those are **Supabase Edge Function secrets** only (`supabase secrets set`).

## Pre-deploy verification (local)

```bash
npm install
npm run lint        # tsc --noEmit
npm run build       # must succeed
npm run preview     # smoke test the production build
```

- [ ] `npm run build` passes.
- [ ] App loads on `npm run preview`, deep-link refresh works (`/app`).
- [ ] With Supabase env set locally, sign-in + data reads/writes work.

## Supabase side (before/with first prod deploy)

- [ ] `supabase/schema.sql` applied.
- [ ] `supabase/policies.sql` applied (RLS on for all tables).
- [ ] Realtime enabled for `transactions`, `budgets`, `subscriptions`,
      `user_insights`.
- [ ] Auth → **URL Configuration**: add the Vercel domain(s) to
      **Site URL** + **Redirect URLs** (production *and* `*.vercel.app` preview).
- [ ] Email confirmation setting chosen (on for prod, or SMTP via Resend later).

## Post-deploy smoke test

- [ ] Landing page renders; theme toggle persists.
- [ ] Sign up → lands on Dashboard with seeded data.
- [ ] Add a transaction → dashboard totals + budgets update live.
- [ ] Refresh a deep link (`/app/budgets`) → no 404.
- [ ] Sign out → protected routes redirect to `/signin`.

## Custom domain (optional, free)

- Add your domain in Vercel → Domains.
- Update Supabase Auth **Site URL** / **Redirect URLs** to match.

## CI note

Vercel builds on every push to the production branch and gives a unique Preview
URL per PR — no extra CI service needed at MVP. A `SessionStart` hook
(`.claude/settings.json`) installs deps automatically in web sessions.
