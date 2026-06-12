import { useState } from "react";
import {
  User as UserIcon,
  Palette,
  ShieldCheck,
  CreditCard,
  Link2,
  Check,
  Crown,
  Sun,
  Moon,
  RotateCcw,
  Lock,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionCard, Avatar, Pill } from "../../components/ui/widgets";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { resetUserData } from "../../lib/backend";
import { cn } from "../../lib/utils";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);

  function saveProfile() {
    updateUser({ name: name.trim() || user!.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const isPro = user?.plan === "pro";

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile, security, and plan." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Profile */}
          <SectionCard title="Profile">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? "User"} color={user?.avatarColor} size={56} />
              <div>
                <p className="text-base font-bold text-content">{user?.name}</p>
                <p className="text-sm text-content-muted">{user?.email}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="cf-label">Full name</label>
                <input className="cf-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="cf-label">Email</label>
                <input
                  className="cf-input cursor-not-allowed opacity-70"
                  value={email}
                  readOnly
                  title="Email is tied to your sign-in and can't be changed here."
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button className="cf-btn-primary" onClick={saveProfile}>
                {saved ? <><Check size={16} /> Saved</> : "Save changes"}
              </button>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard title="Appearance">
            <p className="-mt-1 mb-4 flex items-center gap-2 text-sm text-content-secondary">
              <Palette size={15} /> Choose how ClearFunds looks to you.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: "light", label: "Light", icon: Sun, desc: "Soft blue daylight" },
                  { key: "dark", label: "Dark", icon: Moon, desc: "Calm command center" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-4 text-left transition",
                    theme === opt.key
                      ? "ring-2 ring-brand"
                      : "ring-1 ring-border hover:ring-brand/50",
                  )}
                  style={{ background: "rgb(var(--surface-2))" }}
                >
                  <opt.icon size={20} className="text-brand" />
                  <div>
                    <p className="text-sm font-bold text-content">{opt.label}</p>
                    <p className="text-xs text-content-muted">{opt.desc}</p>
                  </div>
                  {theme === opt.key && <Check size={16} className="ml-auto text-brand" />}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Account & security */}
          <SectionCard title="Account & Security">
            <ul className="divide-y divide-border">
              {[
                { icon: Lock, label: "Password", value: "Update your password", action: "Change" },
                { icon: ShieldCheck, label: "Two-factor authentication", value: "Add an extra layer of security", action: "Enable" },
                { icon: UserIcon, label: "Active sessions", value: "1 device currently signed in", action: "Manage" },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-content-secondary">
                    <row.icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-content">{row.label}</p>
                    <p className="text-xs text-content-muted">{row.value}</p>
                  </div>
                  <button className="cf-btn-ghost px-3 py-1.5 text-xs">{row.action}</button>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Plaid connection */}
          <SectionCard title="Bank Connections">
            <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Link2 size={20} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-content">
                  Plaid {plaidConnected ? "connected" : "connection"}
                </p>
                <p className="text-xs text-content-muted">
                  {plaidConnected
                    ? "3 accounts linked · read-only · last synced just now"
                    : "Securely link your bank with read-only access. Placeholder for Plaid integration."}
                </p>
              </div>
              <button
                className={plaidConnected ? "cf-btn-ghost" : "cf-btn-primary"}
                onClick={() => setPlaidConnected((v) => !v)}
              >
                {plaidConnected ? "Disconnect" : "Connect bank"}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-content-muted">
              <ShieldCheck size={13} /> ClearFunds never sees your bank password and can't move money.
            </p>
          </SectionCard>
        </div>

        {/* Right column: plan/billing */}
        <div className="space-y-5">
          <SectionCard title="Plan & Billing">
            <div
              className="rounded-xl p-5 text-white"
              style={{
                background: isPro
                  ? "linear-gradient(135deg, #8B5CF6, #6D28D9)"
                  : "linear-gradient(135deg, #2563EB, #1D4ED8)",
              }}
            >
              <div className="flex items-center justify-between">
                <Pill tone="neutral">
                  {isPro ? <Crown size={12} /> : <CreditCard size={12} />}
                  {isPro ? "Pro" : "Free"}
                </Pill>
                {isPro && <Crown size={20} />}
              </div>
              <p className="mt-3 text-2xl font-extrabold">
                {isPro ? "$9.99" : "$0"}
                <span className="text-sm font-medium opacity-80">/mo</span>
              </p>
              <p className="mt-1 text-sm opacity-90">
                {isPro ? "Thanks for being a Pro member!" : "Start free, upgrade any time."}
              </p>
            </div>

            <ul className="mt-4 space-y-2 text-sm">
              {[
                "Unlimited accounts",
                "Smart budgets & alerts",
                "Powerful reporting",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-content-secondary">
                  <Check size={15} className={isPro ? "text-pro" : "text-content-muted"} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={cn("mt-5 w-full", isPro ? "cf-btn-ghost" : "cf-btn-primary")}
              onClick={() => updateUser({ plan: isPro ? "free" : "pro" })}
            >
              {isPro ? "Switch to Free" : "Upgrade to Pro"}
            </button>
          </SectionCard>

          <SectionCard title="Data">
            <p className="mb-3 text-sm text-content-secondary">
              Reset your demo data back to the original sample set.
            </p>
            <button
              className="cf-btn-ghost w-full"
              onClick={() => user && resetUserData(user)}
            >
              <RotateCcw size={15} /> Reset demo data
            </button>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
