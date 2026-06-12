// ============================================================
// Data layer contract — shared by every adapter.
// The UI only ever talks to this interface (re-exported from
// src/lib/backend.ts), so swapping localStorage <-> Supabase
// never touches a single component.
// ============================================================
import type {
  BankAccount,
  Budget,
  Subscription,
  Transaction,
  User,
  UserInsight,
} from "../types";

export type EntityName =
  | "transactions"
  | "budgets"
  | "subscriptions"
  | "insights"
  | "accounts";

export interface WithId {
  id: string;
  user_id: string;
}

// Synchronous CRUD surface. Adapters that talk to an async backend
// (Supabase) serve reads from an in-memory cache and apply writes
// optimistically, so this stays synchronous and the UI never changes.
export interface EntityCrud<T extends WithId> {
  list(userId: string): T[];
  create(userId: string, data: Omit<T, "id" | "user_id">): T;
  update(userId: string, id: string, patch: Partial<T>): T | undefined;
  remove(userId: string, id: string): void;
  bulkInsert(userId: string, items: Array<Omit<T, "id" | "user_id">>): T[];
  replaceAll(userId: string, items: T[]): void;
}

export interface DataAdapter {
  readonly name: "local" | "supabase";
  transactions: EntityCrud<Transaction>;
  budgets: EntityCrud<Budget>;
  subscriptions: EntityCrud<Subscription>;
  insights: EntityCrud<UserInsight>;
  accounts: EntityCrud<BankAccount>;

  /** Load the signed-in user's data into the read cache (no-op for local). */
  hydrate(userId: string): Promise<void>;
  /** Seed realistic demo data for a brand-new user (idempotent). */
  ensureSeeded(user: User): Promise<void> | void;
  /** Wipe + re-seed the user's data. */
  resetUserData(user: User): Promise<void> | void;
}
