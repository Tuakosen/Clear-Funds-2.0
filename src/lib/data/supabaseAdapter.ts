// ============================================================
// Supabase adapter — PRODUCTION data layer.
//
// The UI calls a synchronous CRUD API (list/create/update/...). Supabase
// is async, so this adapter keeps an in-memory cache per entity:
//   - reads  -> served from cache (sync)
//   - writes -> applied to cache optimistically + emit() for instant UI,
//               then persisted to Supabase; on error we reconcile by
//               re-fetching that table.
//   - realtime -> postgres_changes keep the cache fresh across devices.
//
// All queries are automatically scoped to auth.uid() by RLS, and we also
// pass user_id explicitly for clarity and offline reasoning.
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
import { emit } from "./emitter";
import { seedDemoData } from "./env";
import { getSupabase } from "./supabaseClient";
import type { DataAdapter, EntityCrud, EntityName, WithId } from "./types";

type Row = Record<string, unknown>;

interface TableMap<T extends WithId> {
  table: string;
  /** Map an app entity (or partial) to a Supabase row (snake_case columns). */
  toDb(entity: Partial<T>): Row;
  /** Map a Supabase row back to an app entity. */
  fromDb(row: Row): T;
}

// Only `limit` (budgets) and a handful of subscription fields differ from
// the column names; everything else is a 1:1 pass-through.
const MAPS: {
  transactions: TableMap<Transaction>;
  budgets: TableMap<Budget>;
  subscriptions: TableMap<Subscription>;
  insights: TableMap<UserInsight>;
  accounts: TableMap<BankAccount>;
} = {
  transactions: {
    table: "transactions",
    toDb: (t) => prune(t),
    fromDb: (r) => r as unknown as Transaction,
  },
  budgets: {
    table: "budgets",
    toDb: (b) => {
      const { limit, ...rest } = b as Partial<Budget>;
      return prune({ ...rest, ...(limit !== undefined ? { monthly_limit: limit } : {}) });
    },
    fromDb: (r) => {
      const { monthly_limit, ...rest } = r;
      return { ...(rest as object), limit: Number(monthly_limit ?? 0) } as Budget;
    },
  },
  subscriptions: {
    table: "subscriptions",
    toDb: (s) => {
      const e = s as Partial<Subscription>;
      return prune({
        ...stripKeys(e, ["basePrice", "currentPrice", "lastPriceChangeAt", "priceHistory"]),
        ...(e.basePrice !== undefined ? { base_price: e.basePrice } : {}),
        ...(e.currentPrice !== undefined ? { current_price: e.currentPrice } : {}),
        ...(e.lastPriceChangeAt !== undefined ? { last_price_change_at: e.lastPriceChangeAt } : {}),
        ...(e.priceHistory !== undefined ? { price_history: e.priceHistory } : {}),
      });
    },
    fromDb: (r) => {
      const { base_price, current_price, last_price_change_at, price_history, ...rest } = r;
      return {
        ...(rest as object),
        basePrice: base_price as number | undefined,
        currentPrice: current_price as number | undefined,
        lastPriceChangeAt: last_price_change_at as string | undefined,
        priceHistory: (price_history as Subscription["priceHistory"]) ?? [],
      } as Subscription;
    },
  },
  insights: {
    table: "user_insights",
    toDb: (i) => prune(i),
    fromDb: (r) => r as unknown as UserInsight,
  },
  // Accounts are written server-side (Edge Functions); the app reads them.
  accounts: {
    table: "accounts",
    toDb: (a) => prune(a),
    fromDb: (r) => r as unknown as BankAccount,
  },
};

// Drop undefined values so partial updates don't null out columns.
function prune(obj: object): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}
function stripKeys(obj: object, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  for (const k of keys) delete out[k];
  return out;
}

const ENTITIES: EntityName[] = [
  "transactions",
  "budgets",
  "subscriptions",
  "insights",
  "accounts",
];

export function createSupabaseAdapter(): DataAdapter {
  const cache: Record<EntityName, WithId[]> = {
    transactions: [],
    budgets: [],
    subscriptions: [],
    insights: [],
    accounts: [],
  };
  let currentUserId = "";
  let realtimeBound = false;
  // Serializes concurrent ensureSeeded() calls (signup fires loadProfile twice:
  // once from signUp() and once from onAuthStateChange) so we never double-seed.
  let seedingInFlight: Promise<void> | null = null;

  const sb = () => getSupabase();
  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  async function fetchEntity(entity: EntityName, userId: string): Promise<void> {
    const map = MAPS[entity];
    const { data, error } = await sb()
      .from(map.table)
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.error(`[supabase] failed to load ${entity}:`, error.message);
      return;
    }
    cache[entity] = (data ?? []).map((r) => map.fromDb(r as Row) as WithId);
    emit();
  }

  function bindRealtime(userId: string): void {
    if (realtimeBound) return;
    realtimeBound = true;
    const channel = sb().channel(`clearfunds:${userId}`);
    ENTITIES.forEach((entity) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: MAPS[entity].table, filter: `user_id=eq.${userId}` },
        () => void fetchEntity(entity, userId),
      );
    });
    channel.subscribe();
  }

  function crud<T extends WithId>(entity: EntityName): EntityCrud<T> {
    const map = MAPS[entity] as unknown as TableMap<T>;
    const rows = () => cache[entity] as T[];

    return {
      list(userId) {
        return rows().filter((r) => r.user_id === userId);
      },
      create(userId, data) {
        const row = { ...(data as object), id: newId(), user_id: userId } as T;
        cache[entity] = [...rows(), row];
        emit();
        void sb()
          .from(map.table)
          .insert(map.toDb(row))
          .then(({ error }) => {
            if (error) {
              console.error(`[supabase] create ${entity} failed:`, error.message);
              void fetchEntity(entity, userId);
            }
          });
        return row;
      },
      update(userId, id, patch) {
        const idx = rows().findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        const next = { ...rows()[idx], ...patch, id, user_id: userId } as T;
        const copy = [...rows()];
        copy[idx] = next;
        cache[entity] = copy;
        emit();
        void sb()
          .from(map.table)
          .update(map.toDb(patch as Partial<T>))
          .eq("id", id)
          .then(({ error }) => {
            if (error) {
              console.error(`[supabase] update ${entity} failed:`, error.message);
              void fetchEntity(entity, userId);
            }
          });
        return next;
      },
      remove(userId, id) {
        cache[entity] = rows().filter((r) => r.id !== id);
        emit();
        void sb()
          .from(map.table)
          .delete()
          .eq("id", id)
          .then(({ error }) => {
            if (error) {
              console.error(`[supabase] delete ${entity} failed:`, error.message);
              void fetchEntity(entity, userId);
            }
          });
      },
      bulkInsert(userId, items) {
        const created = items.map(
          (data) => ({ ...(data as object), id: newId(), user_id: userId }) as T,
        );
        cache[entity] = [...rows(), ...created];
        emit();
        void sb()
          .from(map.table)
          .insert(created.map((r) => map.toDb(r)))
          .then(({ error }) => {
            if (error) {
              console.error(`[supabase] bulkInsert ${entity} failed:`, error.message);
              void fetchEntity(entity, userId);
            }
          });
        return created;
      },
      replaceAll(userId, items) {
        const withIds = items.map((r) => ({ ...r, id: r.id || newId(), user_id: userId }));
        cache[entity] = withIds as T[];
        emit();
        void (async () => {
          const { error: delErr } = await sb().from(map.table).delete().eq("user_id", userId);
          if (delErr) console.error(`[supabase] clear ${entity} failed:`, delErr.message);
          if (withIds.length) {
            const { error } = await sb().from(map.table).insert(withIds.map((r) => map.toDb(r as T)));
            if (error) console.error(`[supabase] replaceAll ${entity} failed:`, error.message);
          }
          void fetchEntity(entity, userId);
        })();
      },
    };
  }

  const adapter: DataAdapter = {
    name: "supabase",
    transactions: crud<Transaction>("transactions"),
    budgets: crud<Budget>("budgets"),
    subscriptions: crud<Subscription>("subscriptions"),
    insights: crud<UserInsight>("insights"),
    accounts: crud<BankAccount>("accounts"),

    async hydrate(userId) {
      currentUserId = userId;
      await Promise.all(ENTITIES.map((e) => fetchEntity(e, userId)));
      bindRealtime(userId);
    },

    async ensureSeeded(user: User) {
      // Dedupe overlapping calls so the same user is hydrated/seeded once.
      if (seedingInFlight) return seedingInFlight;
      seedingInFlight = (async () => {
        if (currentUserId !== user.id) await adapter.hydrate(user.id);
        // Real Supabase users start empty. Demo seeding is opt-in only
        // (local/mock mode, or VITE_SEED_NEW_USERS="true").
        if (!seedDemoData) return;
        const empty =
          cache.transactions.length === 0 &&
          cache.budgets.length === 0 &&
          cache.subscriptions.length === 0;
        if (!empty) return;
        adapter.transactions.replaceAll(user.id, seedTransactions(user.id));
        adapter.budgets.replaceAll(user.id, seedBudgets(user.id));
        adapter.subscriptions.replaceAll(user.id, seedSubscriptions(user.id));
      })();
      try {
        await seedingInFlight;
      } finally {
        seedingInFlight = null;
      }
    },

    async resetUserData(user: User) {
      for (const entity of ENTITIES) {
        const { error } = await sb().from(MAPS[entity].table).delete().eq("user_id", user.id);
        if (error) console.error(`[supabase] reset ${entity} failed:`, error.message);
        cache[entity] = [];
      }
      emit();
      await adapter.ensureSeeded(user);
    },
  };

  return adapter;
}
