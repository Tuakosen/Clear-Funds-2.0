# ClearFunds 2.0

**Transparency made simple** — a personal finance dashboard with a clean, premium fintech aesthetic.

ClearFunds brings tracking, budgeting, subscriptions, and insights into one calm command
center. Light mode uses a soft blue-tinted system; dark mode feels like a calm command
center (no harsh whites, no white chart boxes).

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** with semantic theme tokens (CSS variables for light/dark)
- **React Router** for marketing + app routing
- **Recharts** for the income/expenses, donut, and trend charts
- **lucide-react** icons
- **Swappable data layer** — a synchronous `DataAdapter` interface with two
  implementations behind it, all scoped by `user_id`:
  - **localStorage adapter** — the zero-config development default.
  - **Supabase adapter** — production (Postgres + RLS + Realtime), auto-selected
    when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set.
  The UI only imports from `src/lib/backend.ts`, so switching backends changes
  **no components**. See [`docs/`](./docs) for the full free-tier deployment plan
  (Supabase, Vercel, Plaid Sandbox, Stripe-later).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # tsc --noEmit
```

## Project structure

```
src/
  lib/            types, seed data, finance math, categories, utils
    backend.ts    public data surface (re-exports the active adapter)
    data/         adapter layer: types, emitter, localAdapter, supabaseAdapter,
                  supabaseClient, index (selector)
  context/        AuthContext (mock auth), ThemeContext (light/dark)
  hooks/          useData — live, user-scoped entity reads
  components/
    ui/           Logo, Modal, ThemeToggle, widgets (StatCard, ProgressBar, …)
    layout/       AppLayout, Sidebar, PageHeader
    charts/       IncomeExpensesChart, CategoryDonut (interactive)
    forms/        Transaction / Budget / Subscription modals
    landing/      header, footer, feature dropdown, hero, pricing, mocks, blocks
  pages/
    Landing, Pricing, Security, Auth, NotFound
    features/     Tracking, Budgeting, SubscriptionsFeature
    app/          Dashboard, Transactions, Budgets, Subscriptions, Insights, Settings
```

## Data model (all scoped by `user_id`)

- **Transaction** — title, vendor, amount, type, category, date, notes, source, bank_account
- **Budget** — category, limit, month, icon, color, alerts_enabled
- **Subscription** — name, amount, basePrice/currentPrice, priceHistory, billing_cycle,
  next_billing_date, category, status, logo_url, usage_rating, …
- **UserInsight** — type, data, generated_at

## How it fits together

- **Budgets are category-driven.** Usage is computed by scanning the Transactions table for
  the selected month (expenses only) — change a transaction's category and the matching
  budget updates automatically. Nothing is double-stored.
- **Dashboard, Insights, and Subscriptions all derive from the same transactions**, so adding
  or editing a transaction updates totals everywhere live.
- **Theme tokens** live in `src/index.css` as CSS variables; charts read `--chart-*` tokens so
  dark mode never shows a white chart box.

## Auth & backend

Out of the box this runs with a **mock auth + localStorage adapter** — zero config,
seeded with realistic demo data. To go independent on free-tier infrastructure,
add Supabase env vars and the app switches to the **Supabase adapter** automatically
(no component changes). Step-by-step guides:

- [Free-tier architecture](./docs/architecture.md)
- [Supabase schema](./supabase/schema.sql) & [RLS policies](./supabase/policies.sql)
- [Supabase Auth integration](./docs/auth-integration.md)
- [localStorage → Supabase migration](./docs/migration-localstorage-to-supabase.md)
- [Plaid Sandbox integration](./docs/plaid-sandbox.md)
- [Vercel deployment](./docs/vercel-deployment.md) & [env vars](./docs/environment-variables.md)
