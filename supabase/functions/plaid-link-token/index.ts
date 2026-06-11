// ============================================================
// Edge Function: plaid-link-token
// Creates a Plaid Link token (SANDBOX) for the signed-in user.
// The browser uses this token to open Plaid Link.
//
// Deploy:  supabase functions deploy plaid-link-token
// Secrets: supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... \
//            PLAID_ENV=sandbox
//
// NOTE: Skeleton — wired for Sandbox, safe to deploy when you're ready.
// Not invoked by the app yet (Plaid UI comes in a later phase).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Identify the caller from their Supabase JWT.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const res = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("PLAID_CLIENT_ID"),
        secret: Deno.env.get("PLAID_SECRET"),
        client_name: "ClearFunds",
        language: "en",
        country_codes: ["US"],
        user: { client_user_id: user.id },
        products: ["transactions"],
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data.error_message ?? "Plaid error" }, 400);
    return json({ link_token: data.link_token });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
