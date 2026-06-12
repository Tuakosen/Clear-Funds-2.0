import { useState } from "react";
import { Landmark, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../hooks/useData";
import { hydrate } from "../../lib/backend";
import { removeBank } from "../../lib/plaid";
import { cn, formatCurrency, timeAgo } from "../../lib/utils";
import type { BankAccount } from "../../lib/types";
import { ConnectBankButton } from "./ConnectBankButton";
import { SyncNowButton } from "./SyncNowButton";

interface Connection {
  key: string;
  itemId?: string;
  institution: string;
  accounts: BankAccount[];
  lastSynced?: string;
  total: number;
}

function groupConnections(accounts: BankAccount[]): Connection[] {
  const map = new Map<string, Connection>();
  for (const a of accounts) {
    const key = a.item_id ?? a.institution ?? a.id;
    if (!map.has(key)) {
      map.set(key, {
        key,
        itemId: a.item_id,
        institution: a.institution || "Linked bank",
        accounts: [],
        lastSynced: a.last_synced_at,
        total: 0,
      });
    }
    const c = map.get(key)!;
    c.accounts.push(a);
    c.total += Number(a.current_balance ?? 0);
    if (a.last_synced_at && (!c.lastSynced || a.last_synced_at > c.lastSynced)) {
      c.lastSynced = a.last_synced_at;
    }
  }
  return Array.from(map.values());
}

export function BankConnections() {
  const { user } = useAuth();
  const { accounts } = useData();
  const connections = groupConnections(accounts);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function disconnect(c: Connection) {
    if (!c.itemId || !user) return;
    setRemoving(c.key);
    setError(null);
    try {
      await removeBank(c.itemId);
      await hydrate(user.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disconnect.");
    } finally {
      setRemoving(null);
      setConfirming(null);
    }
  }

  if (connections.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Landmark size={20} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-content">Connect with Plaid</p>
          <p className="text-xs text-content-muted">
            Securely link your bank with read-only access via Plaid (Sandbox).
          </p>
        </div>
        <ConnectBankButton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-content-secondary">
          {connections.length} institution{connections.length === 1 ? "" : "s"} connected
        </p>
        <div className="flex items-center gap-2">
          <SyncNowButton compact />
          <ConnectBankButton variant="ghost" label="Add another" />
        </div>
      </div>

      <ul className="space-y-2.5">
        {connections.map((c) => (
          <li key={c.key} className="rounded-xl bg-surface-2 p-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Landmark size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-content">{c.institution}</p>
                <p className="text-xs text-content-muted">
                  {c.accounts.length} account{c.accounts.length === 1 ? "" : "s"} ·{" "}
                  {formatCurrency(c.total)} · synced {timeAgo(c.lastSynced)}
                </p>
              </div>
              {confirming === c.key ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => disconnect(c)}
                    disabled={removing === c.key}
                    className="cf-btn px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "#EF4444" }}
                  >
                    {removing === c.key ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Confirm"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="cf-btn-ghost px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(c.key)}
                  className="rounded-lg p-2 text-content-muted transition hover:bg-surface hover:text-expense"
                  aria-label="Disconnect"
                  title="Disconnect bank"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && <p className="text-xs font-medium text-expense">{error}</p>}
      <p className="flex items-center gap-1.5 text-xs text-content-muted">
        <ShieldCheck size={13} /> ClearFunds never sees your bank password and can't move money.
      </p>
    </div>
  );
}
