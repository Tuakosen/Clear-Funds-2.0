import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Landmark, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hydrate } from "../../lib/backend";
import {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
} from "../../lib/plaid";
import { cn } from "../../lib/utils";

// Opens Plaid Link (Sandbox), exchanges the public token server-side, syncs
// transactions + accounts into Supabase, then refreshes the local cache.
// Sandbox logins: user_good / pass_good, or user_transactions_dynamic / any.
export function ConnectBankButton({
  variant = "primary",
  label = "Connect bank",
  onLinked,
}: {
  variant?: "primary" | "ghost";
  label?: string;
  onLinked?: () => void;
}) {
  const { user } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback(
    async (publicToken: string) => {
      setBusy(true);
      setError(null);
      try {
        await exchangePublicToken(publicToken);
        await syncTransactions();
        if (user) await hydrate(user.id);
        onLinked?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to link account.");
      } finally {
        setBusy(false);
        setLinkToken(null);
      }
    },
    [user, onLinked],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => {
      setBusy(false);
      setLinkToken(null);
    },
  });

  // Open Link as soon as we have a token and the widget is ready.
  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      setLinkToken(await createLinkToken());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Plaid.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={cn(variant === "primary" ? "cf-btn-primary" : "cf-btn-ghost")}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Landmark size={16} />}
        {busy ? "Connecting…" : label}
      </button>
      {error && <p className="text-xs font-medium text-expense">{error}</p>}
    </div>
  );
}
