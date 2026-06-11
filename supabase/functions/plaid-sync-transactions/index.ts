// ============================================================
// Edge Function: plaid-sync-transactions
// Pulls new/updated transactions for the user's linked items using
// Plaid's /transactions/sync cursor and upserts them into the
// ClearFunds `transactions` table (mapped to our schema).
//
// Intended to run on demand (button) and/or on a schedule
// (supabase cron). Skeleton — Sandbox-ready.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: items } = await admin
      .from("plaid_items")
      .select("item_id, access_token, sync_cursor")
      .eq("user_id", user.id);

    let imported = 0;
    for (const item of items ?? []) {
      const res = await fetch(`${PLAID_BASE}/transactions/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: Deno.env.get("PLAID_CLIENT_ID"),
          secret: Deno.env.get("PLAID_SECRET"),
          access_token: item.access_token,
          cursor: item.sync_cursor ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) continue;

      const rows = (data.added ?? []).map((t: Record<string, unknown>) => ({
        user_id: user.id,
        title: t.name,
        vendor: t.merchant_name ?? t.name,
        amount: Math.abs(Number(t.amount)),
        type: Number(t.amount) < 0 ? "income" : "expense",
        category: (t.personal_finance_category as { primary?: string } | null)?.primary ?? "Other",
        date: t.date,
        source: "Plaid",
        bank_account: t.account_id,
      }));

      if (rows.length) {
        await admin.from("transactions").insert(rows);
        imported += rows.length;
      }
      await admin
        .from("plaid_items")
        .update({ sync_cursor: data.next_cursor })
        .eq("item_id", item.item_id);
    }

    return json({ ok: true, imported });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
