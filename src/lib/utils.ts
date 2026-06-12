export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(value: number, opts: { compact?: boolean } = {}): string {
  const abs = Math.abs(value);
  if (opts.compact && abs >= 1000) {
    return (
      (value < 0 ? "-" : "") +
      "$" +
      (abs / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) +
      "k"
    );
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyShort(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  if (style === "long") {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function monthShortLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "never";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now.getTime()) / 86400000);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Normalize any subscription billing cycle to a monthly figure.
export function monthlyFromCycle(amount: number, cycle: string): number {
  switch (cycle) {
    case "yearly":
      return amount / 12;
    case "quarterly":
      return amount / 3;
    case "weekly":
      return (amount * 52) / 12;
    default:
      return amount;
  }
}
