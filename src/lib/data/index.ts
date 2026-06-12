// ============================================================
// Adapter selector — the single place that decides which backend
// the app talks to. Everything else imports `db` and friends from
// here (via src/lib/backend.ts) and is completely unaware of which
// implementation is live.
//
// Rules:
//   - No Supabase env configured            -> local (dev default)
//   - VITE_DATA_ADAPTER="local"              -> force local
//   - Supabase configured (prod)             -> supabase
// ============================================================
import { createLocalAdapter } from "./localAdapter";
import { createLazySupabaseAdapter } from "./lazySupabaseAdapter";
import { dataAdapterMode, isSupabaseConfigured } from "./env";
import type { DataAdapter } from "./types";

// Note: the Supabase adapter is loaded via a dynamic import inside the lazy
// wrapper, so @supabase/supabase-js never enters the main bundle. This
// selector only reads env flags (env.ts imports no SDK).
function selectAdapter(): DataAdapter {
  if (dataAdapterMode === "local") return createLocalAdapter();
  if (dataAdapterMode === "supabase" || isSupabaseConfigured)
    return createLazySupabaseAdapter();
  return createLocalAdapter();
}

const adapter = selectAdapter();

/** Which backend is live — handy for debugging / status UI. */
export const dataBackend = adapter.name;

export const db = {
  transactions: adapter.transactions,
  budgets: adapter.budgets,
  subscriptions: adapter.subscriptions,
  insights: adapter.insights,
  accounts: adapter.accounts,
};

export const hydrate = adapter.hydrate.bind(adapter);
export const ensureSeeded = adapter.ensureSeeded.bind(adapter);
export const resetUserData = adapter.resetUserData.bind(adapter);

export { subscribe } from "./emitter";
export type { DataAdapter, EntityCrud, EntityName } from "./types";
