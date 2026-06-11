import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../lib/types";
import { ensureSeeded } from "../lib/backend";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, name?: string) => User;
  signUp: (name: string, email: string) => User;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_KEY = "clearfunds.session";
const AVATAR_COLORS = ["#2563EB", "#40D6C9", "#8B5CF6", "#22C55E", "#F59E0B"];

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persist(user: User | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

function deriveId(email: string): string {
  // Stable id from email so returning users keep their data.
  return "user_" + btoa(email.toLowerCase()).replace(/[^a-z0-9]/gi, "").slice(0, 16);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) ensureSeeded(user);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function establish(u: User): User {
    persist(u);
    ensureSeeded(u);
    setUser(u);
    return u;
  }

  const value: AuthCtx = {
    user,
    loading,
    signIn(email, name) {
      const id = deriveId(email);
      const u: User = {
        id,
        email,
        name: name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        plan: "free",
        avatarColor: AVATAR_COLORS[id.length % AVATAR_COLORS.length],
      };
      return establish(u);
    },
    signUp(name, email) {
      const id = deriveId(email);
      const u: User = {
        id,
        email,
        name,
        plan: "free",
        avatarColor: AVATAR_COLORS[name.length % AVATAR_COLORS.length],
      };
      return establish(u);
    },
    signOut() {
      persist(null);
      setUser(null);
    },
    updateUser(patch) {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        persist(next);
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
