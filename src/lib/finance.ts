import type { Budget, Subscription, Transaction } from "./types";
import { getCategory } from "./categories";
import { monthKey, monthShortLabel, monthlyFromCycle } from "./utils";

export function txMonth(t: Transaction): string {
  return t.date.slice(0, 7);
}

export function inMonth(t: Transaction, month: string): boolean {
  return txMonth(t) === month;
}

export interface Totals {
  income: number;
  expenses: number;
  net: number;
}

export function totalsForMonth(txns: Transaction[], month: string): Totals {
  let income = 0;
  let expenses = 0;
  for (const t of txns) {
    if (!inMonth(t, month)) continue;
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  }
  return { income, expenses, net: income - expenses };
}

export function totalsAll(txns: Transaction[]): Totals {
  let income = 0;
  let expenses = 0;
  for (const t of txns) {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  }
  return { income, expenses, net: income - expenses };
}

// ---- Income vs Expenses series (populated, never sparse) ----
export interface MonthlySeriesPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
}

export function monthlySeries(txns: Transaction[], months = 6): MonthlySeriesPoint[] {
  const now = new Date();
  const points: MonthlySeriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const t = totalsForMonth(txns, key);
    points.push({
      key,
      label: monthShortLabel(key),
      income: Math.round(t.income),
      expenses: Math.round(t.expenses),
    });
  }
  return points;
}

// ---- Spending by category (current month, expenses only) ----
export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export function spendingByCategory(txns: Transaction[], month: string): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "expense" || !inMonth(t, month)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: getCategory(name).color,
    }))
    .sort((a, b) => b.value - a.value);
}

// ---- Budget usage: scan transactions, expenses only, selected month ----
export interface BudgetUsage {
  budget: Budget;
  used: number;
  remaining: number;
  pct: number;
  over: boolean;
}

export function computeBudgetUsage(
  budget: Budget,
  txns: Transaction[],
  month: string,
): BudgetUsage {
  let used = 0;
  for (const t of txns) {
    if (t.type === "expense" && t.category === budget.category && inMonth(t, month)) {
      used += t.amount;
    }
  }
  used = Math.round(used * 100) / 100;
  const remaining = Math.round((budget.limit - used) * 100) / 100;
  const pct = budget.limit > 0 ? Math.round((used / budget.limit) * 100) : 0;
  return { budget, used, remaining, pct, over: used > budget.limit };
}

// ---- Safe to spend ----
export function safeToSpend(
  txns: Transaction[],
  subs: Subscription[],
  month: string,
): number {
  const { income, expenses } = totalsForMonth(txns, month);
  const upcomingSubs = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + monthlyFromCycle(s.amount, s.billing_cycle), 0);
  // Income earned this month, minus what's already spent, minus a buffer for
  // remaining active subscriptions not yet charged.
  return Math.round((income - expenses - upcomingSubs * 0.25) * 100) / 100;
}

// ---- Fixed bills heuristic (Housing + Utilities + active subs) ----
export function fixedBills(txns: Transaction[], subs: Subscription[], month: string): number {
  const fixedCats = new Set(["Housing", "Utilities"]);
  let total = 0;
  for (const t of txns) {
    if (t.type === "expense" && inMonth(t, month) && fixedCats.has(t.category)) {
      total += t.amount;
    }
  }
  const subsMonthly = subs
    .filter((s) => s.status === "active")
    .reduce((s, sub) => s + monthlyFromCycle(sub.amount, sub.billing_cycle), 0);
  return Math.round((total + subsMonthly) * 100) / 100;
}

// ---- Subscriptions roll-ups ----
export function subscriptionTotals(subs: Subscription[]) {
  const active = subs.filter((s) => s.status === "active");
  const monthly = active.reduce(
    (sum, s) => sum + monthlyFromCycle(s.amount, s.billing_cycle),
    0,
  );
  return {
    monthly: Math.round(monthly * 100) / 100,
    annual: Math.round(monthly * 12 * 100) / 100,
    activeCount: active.length,
  };
}

// ---- Detect recurring charges from transactions (suggest subscriptions) ----
export interface RecurringSuggestion {
  vendor: string;
  title: string;
  amount: number;
  occurrences: number;
  category: string;
}

export function detectRecurring(
  txns: Transaction[],
  existingSubs: Subscription[],
): RecurringSuggestion[] {
  const existing = new Set(existingSubs.map((s) => s.name.toLowerCase()));
  const groups = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (t.type !== "expense") continue;
    const k = t.vendor.toLowerCase();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  const out: RecurringSuggestion[] = [];
  for (const [, list] of groups) {
    if (list.length < 3) continue;
    // Similar amounts across months => looks recurring.
    const amounts = list.map((t) => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const consistent = amounts.every((a) => Math.abs(a - avg) / avg < 0.15);
    const months = new Set(list.map(txMonth));
    if (consistent && months.size >= 3) {
      const sample = list[0];
      if (existing.has(sample.vendor.toLowerCase())) continue;
      out.push({
        vendor: sample.vendor,
        title: sample.title,
        amount: Math.round(avg * 100) / 100,
        occurrences: list.length,
        category: sample.category,
      });
    }
  }
  return out.sort((a, b) => b.occurrences - a.occurrences).slice(0, 6);
}

// ---- Smart budget suggestions: average monthly spend over last 90 days ----
export interface BudgetSuggestion {
  category: string;
  suggested: number;
  avgMonthly: number;
}

export function suggestBudgets(txns: Transaction[]): BudgetSuggestion[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const totals = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "expense" || t.date < cutoffIso) continue;
    if (t.category === "Income") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => {
      const avgMonthly = total / 3;
      // Suggest a limit ~10% above recent average, rounded to a clean number.
      const suggested = Math.max(20, Math.round((avgMonthly * 1.1) / 10) * 10);
      return { category, suggested, avgMonthly: Math.round(avgMonthly) };
    })
    .sort((a, b) => b.suggested - a.suggested);
}

// ---- Upcoming bills (next 30 days from subscriptions) ----
export function upcomingBills(subs: Subscription[], days = 30) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const horizon = now.getTime() + days * 86400000;
  return subs
    .filter((s) => s.status === "active")
    .map((s) => ({
      ...s,
      dueTime: new Date(s.next_billing_date + "T00:00:00").getTime(),
    }))
    .filter((s) => s.dueTime >= now.getTime() && s.dueTime <= horizon)
    .sort((a, b) => a.dueTime - b.dueTime);
}
