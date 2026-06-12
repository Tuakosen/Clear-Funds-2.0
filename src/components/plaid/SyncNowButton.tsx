import { useState } from "react";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hydrate } from "../../lib/backend";
import { syncTransactions } from "../../lib/plaid";
import { cn } from "../../lib/utils";

type SyncState = "idle" | "syncing" | "done" | "error";

// Re-pulls transactions + balances for all linked items, then refreshes the
// local cache so the dashboard totals update. Shows loading/success/error.
export function SyncNowButton({
  variant = "ghost",
  compact = false,
  onSynced,
}: {
  variant?: "primary" | "ghost";
  compact?: boolean;
  onSynced?: () => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<SyncState>("idle");

  async function run() {
    if (state === "syncing" || !user) return;
    setState("syncing");
    try {
      await syncTransactions();
      await hydrate(user.id);
      setState("done");
      onSynced?.();
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3500);
    }
  }

  const label =
    state === "syncing"
      ? "Syncing…"
      : state === "done"
        ? "Synced"
        : state === "error"
          ? "Sync failed"
          : "Sync now";

  const Icon =
    state === "done" ? Check : state === "error" ? AlertTriangle : RefreshCw;

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === "syncing"}
      title="Sync transactions and balances"
      className={cn(
        variant === "primary" ? "cf-btn-primary" : "cf-btn-ghost",
        compact && "px-3 py-1.5 text-xs",
        state === "error" && "text-expense",
        state === "done" && "text-income",
      )}
    >
      <Icon size={compact ? 13 : 15} className={cn(state === "syncing" && "animate-spin")} />
      {label}
    </button>
  );
}
