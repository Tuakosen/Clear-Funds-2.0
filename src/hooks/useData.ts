import { useCallback, useEffect, useState } from "react";
import { db, subscribe } from "../lib/backend";
import { useAuth } from "../context/AuthContext";
import type { Budget, Subscription, Transaction } from "../lib/types";

// Live, user-scoped data. Re-reads whenever the backend emits a change.
export function useData() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribe(() => setVersion((v) => v + 1));
  }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // version is intentionally in deps to force re-read on backend changes.
  /* eslint-disable react-hooks/exhaustive-deps */
  const transactions: Transaction[] = uid ? db.transactions.list(uid) : [];
  const budgets: Budget[] = uid ? db.budgets.list(uid) : [];
  const subscriptions: Subscription[] = uid ? db.subscriptions.list(uid) : [];
  /* eslint-enable react-hooks/exhaustive-deps */
  void version;

  return { uid, transactions, budgets, subscriptions, refresh };
}
