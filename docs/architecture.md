# 1. Free-Tier Architecture Plan

ClearFunds runs entirely on free tiers at MVP, with a clean upgrade path to paid
plans only when usage or monetization demands it.

## Stack (all free tier first)

| Concern | Choice | Tier | Notes |
|---|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind | — | Static SPA build |
| Hosting | **Vercel** | Free (Hobby) | Auto deploys from Git, global CDN, SPA rewrites |
| Database | **Supabase Postgres** | Free | 500 MB DB, plenty for MVP |
| Auth | **Supabase Auth** | Free | Email/password + magic link, 50k MAU free |
| Security | **Supabase RLS** | Free | Row-level isolation per `user_id` |
| Backend logic | **Supabase Edge Functions** (Deno) | Free | 500k invocations/mo; used for Plaid/Stripe only |
| Email | **Supabase Auth emails** first | Free | Resend free tier later only if we outgrow it |
| Bank data | **Plaid Sandbox** first | Free | Production keys later behind Edge Functions |
| Payments | **Stripe** | — | Only when monetizing; not implemented yet |
| Monitoring | Vercel Analytics + Supabase logs | Free | No paid monitoring at MVP |

## What we deliberately avoid (and why)

- **Base44** — replaced; we own the whole stack now.
- **Clerk / Auth.js** — Supabase Auth is free and already integrated with RLS.
- **Prisma / Drizzle** — `supabase-js` + plain SQL is enough; no ORM build step.
- **Paid email / monitoring** — Supabase's built-in mail + logs cover MVP.

## High-level diagram

```
                       ┌──────────────────────────┐
   Browser (SPA)  ◀───▶│  Vercel (static hosting)  │
        │              └──────────────────────────┘
        │  supabase-js (HTTPS + WebSocket realtime)
        ▼
┌───────────────────────────────────────────────────────────┐
│                        Supabase                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth    │  │  Postgres+RLS │  │   Edge Functions     │  │
│  │ (JWT)    │─▶│  transactions │  │  plaid-link-token    │  │
│  │          │  │  budgets      │  │  plaid-exchange      │  │
│  │          │  │  subscriptions│  │  plaid-sync          │  │
│  │          │  │  user_insights│  │  (stripe-webhook…)   │  │
│  └──────────┘  └──────────────┘  └──────────┬───────────┘  │
└──────────────────────────────────────────────┼────────────┘
                                                │ server-only secrets
                                    ┌───────────▼───────────┐
                                    │  Plaid (Sandbox→Prod) │
                                    │  Stripe (later)       │
                                    └───────────────────────┘
```

## Trust boundaries

- **Public, in the browser:** Supabase URL + anon key, Stripe publishable key.
  These are safe to ship — **RLS** is what protects data, not key secrecy.
- **Server-only (Edge Function secrets):** Plaid client id/secret, Plaid access
  tokens, Supabase service-role key, Stripe secret + webhook secret. These never
  touch the frontend bundle or the client.

## Data ownership & portability

- Every row is keyed to `auth.uid()`; nothing is shared across users.
- The app talks to a thin `DataAdapter` interface, so the storage backend is
  swappable (localStorage today, Supabase in prod, anything else later).
- No proprietary platform APIs — standard Postgres + standard HTTP.

## Free-tier headroom & when to upgrade

| Signal | Free-tier limit | Action |
|---|---|---|
| DB size > ~400 MB | 500 MB | Supabase Pro ($25/mo) |
| Auth MAU > 50k | 50k | Supabase Pro |
| Edge invocations > 500k/mo | 500k | Supabase Pro |
| Need custom email domain/volume | Supabase mail caps | Add Resend free → paid |
| Real bank data | Plaid Sandbox | Plaid Production (paid) |
| Revenue | — | Turn on Stripe |

Until those signals appear, **everything stays free.**
