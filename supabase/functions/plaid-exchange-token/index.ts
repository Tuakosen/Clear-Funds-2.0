// ============================================================
// Edge Function: plaid-exchange-token
// Exchanges a Plaid public_token (from Link) for an access_token and
// stores it server-side, keyed to the user. The access_token NEVER
// reaches the browser.
//
// Requires a `plaid_items` table (see docs/plaid-sandbox.md) with RLS,
// written here using the service-role key so the secret stays private.
//
// Deploy:  supabase functions deploy plaid-exchange-token
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

    const { public_token } = await req.json();
    if (!public_token) return json({ error: "Missing public_token" }, 400);

    const res = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("PLAID_CLIENT_ID"),
        secret: Deno.env.get("PLAID_SECRET"),
        public_token,
      }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error_message ?? "Plaid error" }, 400);

    // Persist the access token with the service-role key (bypasses RLS).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin.from("plaid_items").upsert({
      user_id: user.id,
      item_id: data.item_id,
      access_token: data.access_token,
    });
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, item_id: data.item_id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
