// ============================================================
// Edge Function: plaid-remove-item
// Disconnects a linked institution for the signed-in user:
//   1) verifies the user owns the item,
//   2) calls Plaid /item/remove to invalidate the access_token,
//   3) deletes the plaid_item (removes access_token) -> no future syncs,
//   4) deletes the item's linked accounts.
// Synced transactions are kept as history. access_token never leaves the server.
//
// Deploy:  supabase functions deploy plaid-remove-item
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

    const { item_id } = await req.json();
    if (!item_id) return json({ error: "Missing item_id" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ownership check + fetch the access token (server-side only).
    const { data: item } = await admin
      .from("plaid_items")
      .select("item_id, access_token")
      .eq("item_id", item_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!item) return json({ error: "Item not found" }, 404);

    // Invalidate at Plaid (best-effort).
    await fetch(`${PLAID_BASE}/item/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("PLAID_CLIENT_ID"),
        secret: Deno.env.get("PLAID_SECRET"),
        access_token: item.access_token,
      }),
    }).catch(() => {});

    // Remove linked accounts, then the item itself (deletes access_token).
    await admin.from("accounts").delete().eq("user_id", user.id).eq("item_id", item_id);
    const { error } = await admin
      .from("plaid_items")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", item_id);
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
