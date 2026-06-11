import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tint = "#2563EB",
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tint?: string;
  delta?: number;
  hint?: string;
}) {
  return (
    <div className="cf-card cf-fade-up p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `${tint}1a`, color: tint }}
        >
          <Icon size={20} />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "cf-chip",
              delta >= 0
                ? "bg-income/10 text-income"
                : "bg-expense/10 text-expense",
            )}
          >
            {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-content-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-content">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("cf-card p-5", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-bold text-content">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Avatar({
  name,
  color = "#2563EB",
  size = 36,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </span>
  );
}

export function ProgressBar({
  value,
  color = "#2563EB",
  className,
}: {
  value: number; // 0-100+
  color?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const over = value > 100;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: over ? "#EF4444" : color,
        }}
      />
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "income" | "expense" | "brand" | "pro" | "warn";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-content-secondary",
    income: "bg-income/10 text-income",
    expense: "bg-expense/10 text-expense",
    brand: "bg-brand/10 text-brand",
    pro: "bg-pro/10 text-pro",
    warn: "bg-amber-500/10 text-amber-500",
  };
  return <span className={cn("cf-chip", tones[tone])}>{children}</span>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon size={26} />
      </div>
      <h4 className="text-base font-bold text-content">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-content-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
