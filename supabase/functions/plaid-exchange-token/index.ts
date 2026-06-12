// ============================================================
// Edge Function: plaid-exchange-token
// Exchanges a Plaid public_token (from Link) for an access_token, stores it
// server-side in plaid_items, and upserts the item's accounts into the
// `accounts` table. The access_token NEVER reaches the browser.
//
// Deploy:  supabase functions deploy plaid-exchange-token
// Secrets: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV=sandbox
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
  const data = await res.json();
  return { ok: res.ok, data };
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

    const { public_token } = await req.json();
    if (!public_token) return json({ error: "Missing public_token" }, 400);

    // 1) Exchange for a long-lived access token.
    const ex = await plaid("/item/public_token/exchange", { public_token });
    if (!ex.ok) return json({ error: ex.data.error_message ?? "Exchange failed" }, 400);
    const accessToken = ex.data.access_token as string;
    const itemId = ex.data.item_id as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 2) Resolve the institution name (best-effort).
    let institution: string | null = null;
    const itemRes = await plaid("/item/get", { access_token: accessToken });
    const instId = itemRes.data?.item?.institution_id;
    if (instId) {
      const instRes = await plaid("/institutions/get_by_id", {
        institution_id: instId,
        country_codes: ["US"],
      });
      institution = instRes.data?.institution?.name ?? null;
    }

    // 3) Persist the item + access token (service role only).
    const { error: itemErr } = await admin.from("plaid_items").upsert(
      { user_id: user.id, item_id: itemId, access_token: accessToken, institution },
      { onConflict: "item_id" },
    );
    if (itemErr) return json({ error: itemErr.message }, 500);

    // 4) Fetch accounts and upsert into `accounts`.
    const acctRes = await plaid("/accounts/get", { access_token: accessToken });
    if (!acctRes.ok) return json({ error: acctRes.data.error_message ?? "Accounts failed" }, 400);

    const rows = (acctRes.data.accounts ?? []).map((a: Record<string, any>) => ({
      user_id: user.id,
      plaid_account_id: a.account_id,
      item_id: itemId,
      name: a.name,
      official_name: a.official_name ?? null,
      mask: a.mask ?? null,
      type: a.type ?? null,
      subtype: a.subtype ?? null,
      current_balance: a.balances?.current ?? 0,
      available_balance: a.balances?.available ?? null,
      currency: a.balances?.iso_currency_code ?? "USD",
      institution,
    }));

    if (rows.length) {
      const { error } = await admin.from("accounts").upsert(rows, {
        onConflict: "plaid_account_id",
      });
      if (error) return json({ error: error.message }, 500);
    }

    return json({ ok: true, item_id: itemId, accounts: rows.length });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
