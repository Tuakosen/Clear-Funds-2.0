// ============================================================
// ClearFunds mock backend
// localStorage-backed entity store, all data scoped by user_id.
// Designed so a real Base44 / API layer can drop in behind the
// same `db` interface later. NO Supabase.
// ============================================================
import type {
  Budget,
  Subscription,
  Transaction,
  User,
  UserInsight,
} from "./types";
import { seedBudgets, seedSubscriptions, seedTransactions } from "./seed";
import { uid } from "./utils";

const PREFIX = "clearfunds.v2";

type EntityName = "transactions" | "budgets" | "subscriptions" | "insights";

interface WithId {
  id: string;
  user_id: string;
}

function key(user_id: string, entity: EntityName): string {
  return `${PREFIX}.${user_id}.${entity}`;
}

function read<T>(user_id: string, entity: EntityName): T[] {
  try {
    const raw = localStorage.getItem(key(user_id, entity));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(user_id: string, entity: EntityName, rows: T[]): void {
  localStorage.setItem(key(user_id, entity), JSON.stringify(rows));
  emit();
}

// ---- change notifications (lets the dashboard live-update) ----
type Listener = () => void;
const listeners = new Set<Listener>();
let emitScheduled = false;
function emit(): void {
  if (emitScheduled) return;
  emitScheduled = true;
  queueMicrotask(() => {
    emitScheduled = false;
    listeners.forEach((l) => l());
  });
}
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---- generic CRUD ----
function crud<T extends WithId>(entity: EntityName) {
  return {
    list(user_id: string): T[] {
      return read<T>(user_id, entity);
    },
    create(user_id: string, data: Omit<T, "id" | "user_id">): T {
      const rows = read<T>(user_id, entity);
      const row = { ...(data as object), id: uid(entity.slice(0, 3)), user_id } as T;
      rows.push(row);
      write(user_id, entity, rows);
      return row;
    },
    update(user_id: string, id: string, patch: Partial<T>): T | undefined {
      const rows = read<T>(user_id, entity);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      rows[idx] = { ...rows[idx], ...patch, id, user_id };
      write(user_id, entity, rows);
      return rows[idx];
    },
    remove(user_id: string, id: string): void {
      const rows = read<T>(user_id, entity).filter((r) => r.id !== id);
      write(user_id, entity, rows);
    },
    bulkInsert(user_id: string, items: Array<Omit<T, "id" | "user_id">>): T[] {
      const rows = read<T>(user_id, entity);
      const created = items.map(
        (data) => ({ ...(data as object), id: uid(entity.slice(0, 3)), user_id }) as T,
      );
      rows.push(...created);
      write(user_id, entity, rows);
      return created;
    },
    replaceAll(user_id: string, items: T[]): void {
      write(user_id, entity, items);
    },
  };
}

export const db = {
  transactions: crud<Transaction>("transactions"),
  budgets: crud<Budget>("budgets"),
  subscriptions: crud<Subscription>("subscriptions"),
  insights: crud<UserInsight>("insights"),
};

// Seed a brand-new user with realistic demo data once.
export function ensureSeeded(user: User): void {
  const flag = `${PREFIX}.${user.id}.seeded`;
  if (localStorage.getItem(flag)) return;
  db.transactions.replaceAll(user.id, seedTransactions(user.id));
  db.budgets.replaceAll(user.id, seedBudgets(user.id));
  db.subscriptions.replaceAll(user.id, seedSubscriptions(user.id));
  localStorage.setItem(flag, "1");
  emit();
}

export function resetUserData(user: User): void {
  localStorage.removeItem(`${PREFIX}.${user.id}.seeded`);
  (["transactions", "budgets", "subscriptions", "insights"] as EntityName[]).forEach((e) =>
    localStorage.removeItem(key(user.id, e)),
  );
  ensureSeeded(user);
}
