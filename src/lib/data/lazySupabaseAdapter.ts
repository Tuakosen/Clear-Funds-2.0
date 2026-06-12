// ============================================================
// Lazy Supabase adapter.
//
// Keeps @supabase/supabase-js OUT of the main bundle: the real
// Supabase adapter (and the SDK it pulls in) is loaded via a dynamic
// import only when the app actually needs it — i.e. on first hydrate /
// ensureSeeded, which happens at login.
//
// This wrapper is a synchronous DataAdapter so nothing in the UI or the
// selector changes. Before the real adapter finishes loading, reads
// return [] (identical to the real adapter's empty pre-hydrate cache);
// once loaded, every call delegates to it. All writes happen post-login
// (after ensureSeeded awaits the load), so behavior is unchanged.
// ============================================================
import type {
  BankAccount,
  Budget,
  Subscription,
  Transaction,
  User,
  UserInsight,
} from "../types";
import { emit } from "./emitter";
import type { DataAdapter, EntityCrud, EntityName, WithId } from "./types";

export function createLazySupabaseAdapter(): DataAdapter {
  let impl: DataAdapter | null = null;
  let implPromise: Promise<DataAdapter> | null = null;

  // Fetch the Supabase chunk on first use (login), not at app start.
  function load(): Promise<DataAdapter> {
    if (!implPromise) {
      implPromise = import("./supabaseAdapter").then((m) => {
        impl = m.createSupabaseAdapter();
        emit(); // re-render anything that read an empty list pre-load
        return impl;
      });
    }
    return implPromise;
  }

  const newId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function crud<T extends WithId>(entity: EntityName): EntityCrud<T> {
    const real = () => (impl ? (impl[entity] as unknown as EntityCrud<T>) : null);
    return {
      list(userId) {
        return real()?.list(userId) ?? [];
      },
      create(userId, data) {
        const r = real();
        if (r) return r.create(userId, data);
        // Pre-load fallback (unused in practice): forward once loaded.
        void load().then((a) => (a[entity] as unknown as EntityCrud<T>).create(userId, data));
        return { ...(data as object), id: newId(), user_id: userId } as T;
      },
      update(userId, id, patch) {
        const r = real();
        if (r) return r.update(userId, id, patch);
        void load().then((a) => (a[entity] as unknown as EntityCrud<T>).update(userId, id, patch));
        return undefined;
      },
      remove(userId, id) {
        const r = real();
        if (r) return r.remove(userId, id);
        void load().then((a) => (a[entity] as unknown as EntityCrud<T>).remove(userId, id));
      },
      bulkInsert(userId, items) {
        const r = real();
        if (r) return r.bulkInsert(userId, items);
        void load().then((a) => (a[entity] as unknown as EntityCrud<T>).bulkInsert(userId, items));
        return items.map(
          (d) => ({ ...(d as object), id: newId(), user_id: userId }) as T,
        );
      },
      replaceAll(userId, items) {
        const r = real();
        if (r) return r.replaceAll(userId, items);
        void load().then((a) => (a[entity] as unknown as EntityCrud<T>).replaceAll(userId, items));
      },
    };
  }

  return {
    name: "supabase",
    transactions: crud<Transaction>("transactions"),
    budgets: crud<Budget>("budgets"),
    subscriptions: crud<Subscription>("subscriptions"),
    insights: crud<UserInsight>("insights"),
    accounts: crud<BankAccount>("accounts"),

    async hydrate(userId) {
      await (await load()).hydrate(userId);
    },
    async ensureSeeded(user: User) {
      await (await load()).ensureSeeded(user);
    },
    async resetUserData(user: User) {
      await (await load()).resetUserData(user);
    },
  };
}
