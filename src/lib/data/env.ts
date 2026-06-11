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
