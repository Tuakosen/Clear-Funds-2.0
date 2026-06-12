// ============================================================
// Supabase / adapter environment flags.
// IMPORTANT: this module must NOT import @supabase/supabase-js, so the
// selector can read config without pulling the Supabase SDK into the
// main bundle. The SDK only loads via the lazy adapter's dynamic import.
// ============================================================
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both Supabase public env vars are present. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Optional explicit override: "local" | "supabase". */
export const dataAdapterMode = (
  import.meta.env.VITE_DATA_ADAPTER ?? ""
).toLowerCase();

/** True when the live data backend is Supabase (mirrors the selector logic). */
export const usesSupabase =
  dataAdapterMode !== "local" &&
  (dataAdapterMode === "supabase" || isSupabaseConfigured);

/**
 * Whether to use demo/seed data (transactions, budgets, subscriptions, and the
 * mock Accounts card). Real Supabase users start completely empty by default.
 * Demo data is only enabled when:
 *   - the local/mock adapter is active (development), or
 *   - VITE_SEED_NEW_USERS="true" is set explicitly.
 * In production (Supabase) the default is OFF — no env var required.
 */
export const seedDemoData =
  !usesSupabase || import.meta.env.VITE_SEED_NEW_USERS === "true";
