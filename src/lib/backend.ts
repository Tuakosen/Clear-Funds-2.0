// ============================================================
// ClearFunds data backend — public surface for the whole app.
//
// This file is intentionally a thin re-export. The actual implementation
// is chosen at runtime by the adapter selector in ./data:
//   - localStorage adapter  (development default, zero config)
//   - Supabase adapter       (production, when env is configured)
//
// UI components import `db`, `subscribe`, `ensureSeeded`, `resetUserData`
// from here and never need to know which backend is active.
// ============================================================
export {
  db,
  subscribe,
  hydrate,
  ensureSeeded,
  resetUserData,
  dataBackend,
} from "./data";
export type { DataAdapter, EntityName } from "./data";
