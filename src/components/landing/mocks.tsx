import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Film,
  Briefcase,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { MockFrame } from "./blocks";
import { CategoryDonut } from "../charts/CategoryDonut";
import { ProgressBar } from "../ui/widgets";
import { formatCurrency } from "../../lib/utils";

const ROW = "flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5";

export function TransactionsMock() {
  const items = [
    { t: "Whole Foods", c: "Groceries", a: -86.4, icon: ShoppingCart, color: "#22C55E" },
    { t: "Monthly Salary", c: "Income", a: 2480, icon: Briefcase, color: "#22C55E", inc: true },
    { t: "Uber", c: "Transport", a: -18.5, icon: Car, color: "#3B82F6" },
    { t: "Olive & Vine", c: "Dining", a: -52.18, icon: Utensils, color: "#F59E0B" },
    { t: "Netflix", c: "Subscriptions", a: -15.49, icon: RefreshCw, color: "#40D6C9" },
  ];
  return (
    <MockFrame>
      <p className="mb-3 text-sm font-bold text-content">Transactions</p>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.t} className={ROW}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${i.color}1f`, color: i.color }}>
              <i.icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-content">{i.t}</p>
              <p className="text-[10px] text-content-muted">{i.c}</p>
            </div>
            <span className={`text-xs font-extrabold tabular-nums ${i.inc ? "text-income" : "text-expense"}`}>
              {i.inc ? "+" : "−"}
              {formatCurrency(Math.abs(i.a))}
            </span>
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}

export function SpendingMock() {
  const data = [
    { name: "Housing", value: 1850, color: "#8B5CF6" },
    { name: "Groceries", value: 540, color: "#22C55E" },
    { name: "Dining", value: 320, color: "#F59E0B" },
    { name: "Transport", value: 180, color: "#3B82F6" },
    { name: "Entertainment", value: 120, color: "#EC4899" },
  ];
  return (
    <MockFrame>
      <p className="mb-2 text-sm font-bold text-content">Spending by category</p>
      <CategoryDonut data={data} height={200} />
    </MockFrame>
  );
}

export function BudgetsMock() {
  const items = [
    { c: "Groceries", used: 540, limit: 600, color: "#22C55E", icon: ShoppingCart },
    { c: "Dining", used: 320, limit: 350, color: "#F59E0B", icon: Utensils },
    { c: "Transport", used: 180, limit: 220, color: "#3B82F6", icon: Car },
    { c: "Housing", used: 1850, limit: 1900, color: "#8B5CF6", icon: Home },
  ];
  return (
    <MockFrame>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-content">Safe to spend</p>
        <p className="text-lg font-extrabold text-teal-accent">{formatCurrency(1240)}</p>
      </div>
      <ul className="space-y-3">
        {items.map((i) => {
          const pct = Math.round((i.used / i.limit) * 100);
          return (
            <li key={i.c}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-content">
                  <i.icon size={13} style={{ color: i.color }} /> {i.c}
                </span>
                <span className="text-content-muted">
                  {formatCurrency(i.used)} / {formatCurrency(i.limit)}
                </span>
              </div>
              <ProgressBar value={pct} color={i.color} />
            </li>
          );
        })}
      </ul>
    </MockFrame>
  );
}

export function SubscriptionsMock() {
  const subs = [
    { n: "Netflix", a: 15.49, up: true, color: "#E50914" },
    { n: "Spotify", a: 11.99, color: "#1DB954" },
    { n: "Adobe CC", a: 22.99, up: true, color: "#FF0000" },
    { n: "iCloud+", a: 2.99, color: "#3B82F6" },
  ];
  return (
    <MockFrame>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-content">Subscriptions</p>
        <span className="text-xs font-semibold text-content-muted">{formatCurrency(53.46)}/mo</span>
      </div>
      <ul className="space-y-2">
        {subs.map((s) => (
          <li key={s.n} className={ROW}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-extrabold text-white" style={{ background: s.color }}>
              {s.n[0]}
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold text-content">{s.n}</p>
              <p className="text-[10px] text-content-muted">Monthly</p>
            </div>
            {s.up && (
              <span className="cf-chip bg-expense/10 text-expense">
                <TrendingUp size={10} /> +$2
              </span>
            )}
            <span className="text-xs font-extrabold text-content">{formatCurrency(s.a)}</span>
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}
