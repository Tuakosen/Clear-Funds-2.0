import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../lib/types";
import { ensureSeeded } from "../lib/backend";
import { isSupabaseConfigured } from "../lib/data/env";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void> | void;
  signUp: (name: string, email: string, password?: string) => Promise<void> | void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const AVATAR_COLORS = ["#2563EB", "#40D6C9", "#8B5CF6", "#22C55E", "#F59E0B"];

// Single selector: real Supabase Auth when env is configured, otherwise the
// localStorage mock. UI components consume the same `useAuth()` either way.
export function AuthProvider({ children }: { children: ReactNode }) {
  return isSupabaseConfigured ? (
    <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  ) : (
    <MockAuthProvider>{children}</MockAuthProvider>
  );
}

// ============================================================
// Supabase Auth provider (production)
// Loads the Supabase client via dynamic import so @supabase/supabase-js
// stays out of the main bundle (preserves the lazy-load).
// ============================================================
let clientPromise: Promise<SupabaseClient> | null = null;
function loadClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("../lib/data/supabaseClient").then((m) => m.getSupabase());
  }
  return clientPromise;
}

async function loadProfile(
  sb: SupabaseClient,
  id: string,
  email?: string,
): Promise<User> {
  const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  const u: User = {
    id, // === auth.uid(), so RLS (auth.uid() = user_id) passes
    email: data?.email ?? email ?? "",
    name: data?.name ?? email?.split("@")[0] ?? "ClearFunds User",
    plan: (data?.plan as User["plan"]) ?? "free",
    avatarColor: data?.avatar_color ?? "#2563EB",
  };
  // Hydrate the data cache for this user (and seed once if empty).
  await Promise.resolve(ensureSeeded(u));
  return u;
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    void loadClient().then(async (sb) => {
      const { data } = await sb.auth.getSession();
      if (!active) return;
      if (data.session) {
        setUser(
          await loadProfile(sb, data.session.user.id, data.session.user.email ?? undefined),
        );
      }
      setLoading(false);

      const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        setUser(
          session
            ? await loadProfile(sb, session.user.id, session.user.email ?? undefined)
            : null,
        );
      });
      cleanupRef.current = () => sub.subscription.unsubscribe();
    });

    return () => {
      active = false;
      cleanupRef.current?.();
    };
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    async signIn(email, password) {
      const sb = await loadClient();
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password: password ?? "",
      });
      if (error) throw error;
      if (data.user) setUser(await loadProfile(sb, data.user.id, data.user.email ?? undefined));
    },
    async signUp(name, email, password) {
      const sb = await loadClient();
      const { data, error } = await sb.auth.signUp({
        email,
        password: password ?? "",
        options: { data: { name } },
      });
      if (error) throw error;
      // When email confirmation is OFF, signUp returns a session immediately.
      if (data.session && data.user) {
        setUser(await loadProfile(sb, data.user.id, data.user.email ?? undefined));
      }
    },
    signOut() {
      void loadClient().then((sb) => sb.auth.signOut());
      setUser(null);
    },
    updateUser(patch) {
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
      if (!user) return;
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.plan !== undefined) row.plan = patch.plan;
      if (patch.avatarColor !== undefined) row.avatar_color = patch.avatarColor;
      if (Object.keys(row).length) {
        void loadClient().then((sb) => sb.from("profiles").update(row).eq("id", user.id));
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ============================================================
// Mock Auth provider (development default — localStorage)
// Behaviour identical to the original mock; password is ignored.
// ============================================================
const SESSION_KEY = "clearfunds.session";

function loadMockSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
function persistMock(user: User | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}
function deriveId(email: string): string {
  return "user_" + btoa(email.toLowerCase()).replace(/[^a-z0-9]/gi, "").slice(0, 16);
}

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadMockSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) ensureSeeded(user);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function establish(u: User) {
    persistMock(u);
    ensureSeeded(u);
    setUser(u);
  }

  const value: AuthCtx = {
    user,
    loading,
    signIn(email) {
      const id = deriveId(email);
      establish({
        id,
        email,
        name: email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        plan: "free",
        avatarColor: AVATAR_COLORS[id.length % AVATAR_COLORS.length],
      });
    },
    signUp(name, email) {
      const id = deriveId(email);
      establish({
        id,
        email,
        name,
        plan: "free",
        avatarColor: AVATAR_COLORS[name.length % AVATAR_COLORS.length],
      });
    },
    signOut() {
      persistMock(null);
      setUser(null);
    },
    updateUser(patch) {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        persistMock(next);
        return next;
      });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
