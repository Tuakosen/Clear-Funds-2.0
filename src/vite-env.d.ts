/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** "local" | "supabase" — overrides automatic adapter selection. */
  readonly VITE_DATA_ADAPTER?: string;
  /** Set to "false" to skip seeding demo data for new Supabase users. */
  readonly VITE_SEED_NEW_USERS?: string;
  /** Stripe publishable key (future monetization; unused at MVP). */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
