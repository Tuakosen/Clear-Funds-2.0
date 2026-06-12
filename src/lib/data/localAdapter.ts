// ============================================================
// Local adapter — localStorage-backed, all data scoped by user_id.
// This is the DEVELOPMENT adapter and the default when no Supabase
// environment is configured. Behaviour is identical to the original
// mock backend so the app runs with zero configuration.
// ============================================================
import type {
  BankAccount,
  Budget,
  Subscription,
  Transaction,
  User,
  UserInsight,
} from "../types";
import { seedBudgets, seedSubscriptions, seedTransactions } from "../seed";
import { uid } from "../utils";
import { emit } from "./emitter";
import type { DataAdapter, EntityCrud, EntityName, WithId } from "./types";

const PREFIX = "clearfunds.v2";

function key(userId: string, entity: EntityName): string {
  return `${PREFIX}.${userId}.${entity}`;
}

function read<T>(userId: string, entity: EntityName): T[] {
  try {
    const raw = localStorage.getItem(key(userId, entity));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(userId: string, entity: EntityName, rows: T[]): void {
  localStorage.setItem(key(userId, entity), JSON.stringify(rows));
  emit();
}

function crud<T extends WithId>(entity: EntityName): EntityCrud<T> {
  return {
    list(userId) {
      return read<T>(userId, entity);
    },
    create(userId, data) {
      const rows = read<T>(userId, entity);
      const row = { ...(data as object), id: uid(entity.slice(0, 3)), user_id: userId } as T;
      rows.push(row);
      write(userId, entity, rows);
      return row;
    },
    update(userId, id, patch) {
      const rows = read<T>(userId, entity);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      rows[idx] = { ...rows[idx], ...patch, id, user_id: userId };
      write(userId, entity, rows);
      return rows[idx];
    },
    remove(userId, id) {
      write(userId, entity, read<T>(userId, entity).filter((r) => r.id !== id));
    },
    bulkInsert(userId, items) {
      const rows = read<T>(userId, entity);
      const created = items.map(
        (data) => ({ ...(data as object), id: uid(entity.slice(0, 3)), user_id: userId }) as T,
      );
      rows.push(...created);
      write(userId, entity, rows);
      return created;
    },
    replaceAll(userId, items) {
      write(userId, entity, items);
    },
  };
}

export function createLocalAdapter(): DataAdapter {
  const adapter: DataAdapter = {
    name: "local",
    transactions: crud<Transaction>("transactions"),
    budgets: crud<Budget>("budgets"),
    subscriptions: crud<Subscription>("subscriptions"),
    insights: crud<UserInsight>("insights"),
    accounts: crud<BankAccount>("accounts"),

    async hydrate() {
      // Data already lives in localStorage; nothing to fetch.
    },

    ensureSeeded(user: User) {
      const flag = `${PREFIX}.${user.id}.seeded`;
      if (localStorage.getItem(flag)) return;
      adapter.transactions.replaceAll(user.id, seedTransactions(user.id));
      adapter.budgets.replaceAll(user.id, seedBudgets(user.id));
      adapter.subscriptions.replaceAll(user.id, seedSubscriptions(user.id));
      localStorage.setItem(flag, "1");
      emit();
    },

    resetUserData(user: User) {
      localStorage.removeItem(`${PREFIX}.${user.id}.seeded`);
      (["transactions", "budgets", "subscriptions", "insights", "accounts"] as EntityName[]).forEach(
        (e) => localStorage.removeItem(key(user.id, e)),
      );
      adapter.ensureSeeded(user);
    },
  };
  return adapter;
}
