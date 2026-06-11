// ============================================================
// Supabase browser client (singleton).
// Reads public env vars injected by Vite at build time. The anon key
// is safe to ship to the browser — Row Level Security is what protects
// the data, not the key.
// ============================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl as url, supabaseAnonKey as anonKey, isSupabaseConfigured } from "./env";

export { isSupabaseConfigured };

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
