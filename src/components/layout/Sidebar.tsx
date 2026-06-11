import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  RefreshCw,
  Sparkles,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { Avatar, Pill } from "../ui/widgets";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/app/budgets", label: "Budgets", icon: Wallet },
  { to: "/app/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { to: "/app/insights", label: "Insights", icon: Sparkles },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar p-4 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ borderRight: "1px solid var(--card-border)" }}
      >
        <div className="mb-7 flex items-center justify-between px-2 pt-1">
          <Logo />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-content-muted hover:text-content lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-brand text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                    : "text-content-secondary hover:bg-surface hover:text-content",
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-2xl bg-surface p-3" style={{ border: "1px solid var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? "User"} color={user?.avatarColor} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-content">{user?.name}</p>
              <p className="truncate text-xs text-content-muted">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Pill tone={user?.plan === "pro" ? "pro" : "brand"}>
              {user?.plan === "pro" ? "Pro plan" : "Free plan"}
            </Pill>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-content-muted transition hover:text-expense"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
