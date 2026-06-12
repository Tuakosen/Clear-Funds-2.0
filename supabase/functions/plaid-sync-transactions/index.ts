// ============================================================
// Edge Function: plaid-sync-transactions
// Pulls added/modified/removed transactions for the user's linked items via
// Plaid's /transactions/sync cursor, maps them to ClearFunds fields, and
// upserts into the `transactions` table. Also refreshes account balances.
//
// Deploy:  supabase functions deploy plaid-sync-transactions
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

async function plaid(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLAID_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("PLAID_CLIENT_ID"),
      secret: Deno.env.get("PLAID_SECRET"),
      ...body,
    }),
  });
  return { ok: res.ok, data: await res.json() };
}

// Map Plaid's Personal Finance Category → ClearFunds category set.
const CATEGORY_MAP: Record<string, string> = {
  FOOD_AND_DRINK: "Dining",
  GENERAL_MERCHANDISE: "Shopping",
  GROCERIES: "Groceries",
  TRANSPORTATION: "Transport",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Utilities",
  HOME_IMPROVEMENT: "Housing",
  MEDICAL: "Health",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Health",
  GENERAL_SERVICES: "Other",
  INCOME: "Income",
  TRANSFER_IN: "Income",
  TRANSFER_OUT: "Other",
  LOAN_PAYMENTS: "Other",
  BANK_FEES: "Other",
};
function mapCategory(primary?: string): string {
  if (!primary) return "Other";
  if (primary.startsWith("FOOD")) return "Dining";
  return CATEGORY_MAP[primary] ?? "Other";
}

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
    let accountsTouched = 0;

    for (const item of items ?? []) {
      // --- transactions/sync (paginate until has_more is false) ---
      let cursor: string | undefined = item.sync_cursor ?? undefined;
      let hasMore = true;
      while (hasMore) {
        const { ok, data } = await plaid("/transactions/sync", {
          access_token: item.access_token,
          cursor,
          count: 250,
        });
        if (!ok) break;

        const upserts = [...(data.added ?? []), ...(data.modified ?? [])].map(
          (t: Record<string, any>) => ({
            user_id: user.id,
            plaid_transaction_id: t.transaction_id,
            account_id: t.account_id,
            title: t.name,
            vendor: t.merchant_name ?? t.name,
            amount: Math.abs(Number(t.amount)),
            // Plaid: positive = money out (expense), negative = money in (income)
            type: Number(t.amount) < 0 ? "income" : "expense",
            category: mapCategory(t.personal_finance_category?.primary),
            date: t.date,
            source: "plaid",
          }),
        );
        if (upserts.length) {
          const { error } = await admin
            .from("transactions")
            .upsert(upserts, { onConflict: "plaid_transaction_id" });
          if (!error) imported += upserts.length;
        }

        const removed = (data.removed ?? []).map((r: { transaction_id: string }) => r.transaction_id);
        if (removed.length) {
          await admin
            .from("transactions")
            .delete()
            .eq("user_id", user.id)
            .in("plaid_transaction_id", removed);
        }

        cursor = data.next_cursor;
        hasMore = data.has_more;
      }

      await admin.from("plaid_items").update({ sync_cursor: cursor }).eq("item_id", item.item_id);

      // --- refresh balances ---
      const bal = await plaid("/accounts/balance/get", { access_token: item.access_token });
      if (bal.ok) {
        for (const a of bal.data.accounts ?? []) {
          await admin
            .from("accounts")
            .update({
              current_balance: a.balances?.current ?? 0,
              available_balance: a.balances?.available ?? null,
            })
            .eq("plaid_account_id", a.account_id);
          accountsTouched++;
        }
      }
    }

    // Best-effort sync log (table is optional).
    await admin
      .from("plaid_transactions_sync_log")
      .insert({ user_id: user.id, imported, accounts_synced: accountsTouched })
      .then(() => {}, () => {});

    return json({ ok: true, imported, accounts: accountsTouched });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
