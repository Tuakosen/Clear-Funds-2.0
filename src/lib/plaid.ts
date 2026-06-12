// ============================================================
// Plaid client helpers (frontend).
// These call Supabase Edge Functions, which hold PLAID_SECRET and the
// access_token server-side. The browser never sees Plaid secrets — it
// only handles short-lived link/public tokens.
//
// supabase.functions.invoke() automatically attaches the user's JWT, so
// the functions can identify the user and RLS/ownership applies.
// The Supabase client is imported dynamically so @supabase/supabase-js
// stays out of the main bundle.
// ============================================================
async function client() {
  const { getSupabase } = await import("./data/supabaseClient");
  return getSupabase();
}

export async function createLinkToken(): Promise<string> {
  const { data, error } = await (await client()).functions.invoke("plaid-link-token");
  if (error) throw new Error(error.message);
  if (!data?.link_token) throw new Error(data?.error ?? "No link token returned");
  return data.link_token as string;
}

export async function exchangePublicToken(publicToken: string): Promise<void> {
  const { data, error } = await (await client()).functions.invoke("plaid-exchange-token", {
    body: { public_token: publicToken },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export interface SyncResult {
  imported: number;
  accounts: number;
}

export async function syncTransactions(): Promise<SyncResult> {
  const { data, error } = await (await client()).functions.invoke("plaid-sync-transactions");
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return { imported: data?.imported ?? 0, accounts: data?.accounts ?? 0 };
}

export async function removeBank(itemId: string): Promise<void> {
  const { data, error } = await (await client()).functions.invoke("plaid-remove-item", {
    body: { item_id: itemId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}
