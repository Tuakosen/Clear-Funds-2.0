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
import { createSupabaseAdapter } from "./supabaseAdapter";
import { isSupabaseConfigured } from "./supabaseClient";
import type { DataAdapter } from "./types";

function selectAdapter(): DataAdapter {
  const mode = (import.meta.env.VITE_DATA_ADAPTER as string | undefined)?.toLowerCase();
  if (mode === "local") return createLocalAdapter();
  if (mode === "supabase" || isSupabaseConfigured) return createSupabaseAdapter();
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
};

export const hydrate = adapter.hydrate.bind(adapter);
export const ensureSeeded = adapter.ensureSeeded.bind(adapter);
export const resetUserData = adapter.resetUserData.bind(adapter);

export { subscribe } from "./emitter";
export type { DataAdapter, EntityCrud, EntityName } from "./types";
