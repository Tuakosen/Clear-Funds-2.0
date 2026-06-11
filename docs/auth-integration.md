# 4. Supabase Auth Integration Plan

**Goal:** replace the mock auth with Supabase Auth so `user.id === auth.uid()`,
which is what makes RLS work. The current mock `AuthContext` stays as the dev
adapter; this is the production swap. **No UI component changes** — the context
keeps the exact same shape (`user`, `loading`, `signIn`, `signUp`, `signOut`,
`updateUser`).

## Why this is low-risk

`src/context/AuthContext.tsx` already exposes a stable interface that the rest of
the app consumes. We only change the *implementation* of that interface. `Auth.tsx`
already redirects via a `useEffect` on `user`, so async sign-in "just works":
the session resolves → `onAuthStateChange` fires → `user` is set → redirect.

## Steps

1. **Enable providers** in Supabase → Authentication → Providers.
   - Email (password) on for MVP. Magic link optional.
   - For local dev, turn **off** "Confirm email" so test signups log in instantly,
     or use the Supabase Inbucket test inbox.
2. **Schema is ready:** `handle_new_user()` in `schema.sql` auto-creates a
   `profiles` row on signup (name/email/plan/avatar_color).
3. **Drop in the Supabase-aware context** below. It auto-falls back to the mock
   when Supabase isn't configured, so dev stays zero-config.
4. **Hydrate data on login:** the context calls `ensureSeeded(user)`, which for
   the Supabase adapter hydrates the cache and seeds a new user once.

## Drop-in replacement for `src/context/AuthContext.tsx`

> This keeps the mock path intact and adds the Supabase path. Copy over the
> existing file when you're ready to go live.

```tsx
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from "react";
import type { User } from "../lib/types";
import { ensureSeeded } from "../lib/backend";
import { isSupabaseConfigured, getSupabase } from "../lib/data/supabaseClient";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, name?: string) => Promise<User | void> | User;
  signUp: (name: string, email: string, password?: string) => Promise<User | void> | User;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
}
const Ctx = createContext<AuthCtx | null>(null);

// ---- Supabase implementation (used when configured) ----
function useSupabaseAuth(): AuthCtx {
  const sb = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(id: string, email?: string): Promise<User> {
    const { data } = await sb.from("profiles").select("*").eq("id", id).single();
    const u: User = {
      id,
      email: data?.email ?? email ?? "",
      name: data?.name ?? (email?.split("@")[0] ?? "User"),
      plan: (data?.plan as User["plan"]) ?? "free",
      avatarColor: data?.avatar_color ?? "#2563EB",
    };
    ensureSeeded(u); // hydrate cache + seed once
    return u;
  }

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (data.session) setUser(await loadProfile(data.session.user.id, data.session.user.email));
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange(async (_e, session) => {
      setUser(session ? await loadProfile(session.user.id, session.user.email) : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line

  return {
    user, loading,
    async signIn(email, _name) {
      const pwd = window.prompt("Password") ?? ""; // replace with your form field
      await sb.auth.signInWithPassword({ email, password: pwd });
    },
    async signUp(name, email, password = "changeme123") {
      await sb.auth.signUp({ email, password, options: { data: { name } } });
    },
    signOut() { void sb.auth.signOut(); },
    updateUser(patch) {
      setUser((p) => (p ? { ...p, ...patch } : p));
      if (user) void sb.from("profiles").update({
        name: patch.name, plan: patch.plan, avatar_color: patch.avatarColor,
      }).eq("id", user.id);
    },
  };
}

// ---- Mock implementation (dev default; current behaviour) ----
function useMockAuth(): AuthCtx { /* …existing AuthContext logic… */ return null as any; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = isSupabaseConfigured ? useSupabaseAuth() : useMockAuth();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

> ⚠️ Don't call hooks conditionally in one component in production — split
> `AuthProviderSupabase` / `AuthProviderMock` into two components and pick at the
> top of `main.tsx`. The snippet above is condensed for clarity.

## Form wiring (`Auth.tsx`)

`Auth.tsx` already collects `name`, `email`, `password`. Pass `password` into
`signUp(name, email, password)` / `signIn(email, password)` — change the two call
sites only; the redirect effect needs no change.

## Email

- **MVP:** rely on Supabase's built-in confirmation / reset emails (free).
- **Later:** if you need branded templates or higher volume, add **Resend**
  (free tier) as the SMTP provider in Supabase → Auth → SMTP. No app code change.

## Acceptance checklist

- [ ] Sign up creates an `auth.users` row **and** a `profiles` row (trigger).
- [ ] `user.id` equals `auth.uid()` (verify a transaction insert passes RLS).
- [ ] Refresh keeps the session (persisted) and re-hydrates data.
- [ ] Sign out clears the session and the cache (re-mount).
- [ ] With Supabase env removed, the app still runs on the mock adapter.
