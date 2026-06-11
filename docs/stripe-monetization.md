# 7. Stripe Monetization Plan (NOT implemented yet)

Payments are **deferred until we're ready to monetize**. This is the blueprint so
the Pro plan can be switched on quickly without rework. **Do not implement now.**

## Product shape (already reflected in the UI)

- **Free** — $0.
- **Pro** — **$9.99/month** or **$7.50/month billed yearly** (`$90/yr`).
- The app already reads `user.plan` (`free` | `pro`) and gates Pro features
  (e.g. Budgets → Auto Adjust). Stripe just needs to flip `profiles.plan`.

## When to turn it on

Only after: real users, a real value prop validated, and Plaid Production (or a
strong reason users will pay). Until then the Pro toggle in Settings is a manual
switch for testing.

## Architecture (free-tier friendly)

```
Browser ──▶ Edge Fn: stripe-create-checkout ──▶ Stripe Checkout (hosted)
                                                     │ user pays
Stripe ──webhook──▶ Edge Fn: stripe-webhook ──▶ update profiles.plan (service role)
Browser ──▶ Edge Fn: stripe-billing-portal ──▶ Stripe Customer Portal (manage/cancel)
```

- **Stripe Checkout + Customer Portal** = no custom payment UI to build or secure.
- All secret-key work happens in Edge Functions; the browser only gets a
  redirect URL and the **publishable** key.

## Pieces to add (later)

1. Stripe products/prices: `price_pro_monthly` ($9.99), `price_pro_yearly` ($90).
2. Edge Functions:
   - `stripe-create-checkout` — creates a Checkout Session for the chosen price,
     `client_reference_id = auth.uid()`.
   - `stripe-webhook` — verifies signature, handles
     `checkout.session.completed`, `customer.subscription.updated/deleted`;
     sets `profiles.plan` + stores `stripe_customer_id`.
   - `stripe-billing-portal` — returns a portal URL for the customer.
3. Schema additions:
   ```sql
   alter table public.profiles
     add column if not exists stripe_customer_id text,
     add column if not exists subscription_status text,
     add column if not exists current_period_end timestamptz;
   ```
4. Secrets (server-only):
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   Frontend gets `VITE_STRIPE_PUBLISHABLE_KEY` only.

## Frontend changes (minimal, later)

- "Upgrade to Pro" in Settings → invoke `stripe-create-checkout` → redirect.
- "Manage billing" → invoke `stripe-billing-portal` → redirect.
- `profiles.plan` already drives feature gating, so once the webhook flips it the
  UI updates with no further changes.

## Cost note

Stripe charges per-transaction fees only (no monthly fee), so adding it doesn't
break the free-tier-first principle — it only costs money when you make money.

## Explicitly out of scope right now

- No Stripe keys, packages, or Edge Functions are added in this phase.
- The Settings "Upgrade" button currently toggles the plan locally for testing.
