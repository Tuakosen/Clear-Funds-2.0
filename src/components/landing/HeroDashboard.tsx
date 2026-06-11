import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { Building2, PiggyBank, LineChart, ShoppingCart, Utensils, Briefcase } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const CHART = [
  { label: "Jan", income: 4200, expenses: 3100 },
  { label: "Feb", income: 4350, expenses: 2980 },
  { label: "Mar", income: 4180, expenses: 3320 },
  { label: "Apr", income: 4600, expenses: 3050 },
  { label: "May", income: 4400, expenses: 3210 },
  { label: "Jun", income: 4520, expenses: 2890 },
];

const ACCOUNTS = [
  { name: "Everyday Checking", inst: "ClearFunds Bank", balance: 4280.55, icon: Building2, accent: "#2563EB" },
  { name: "High-Yield Savings", inst: "ClearFunds Bank", balance: 18650.42, icon: PiggyBank, accent: "#40D6C9" },
  { name: "Investments", inst: "Vanguard", balance: 32418.9, icon: LineChart, accent: "#8B5CF6" },
];

const RECENT = [
  { title: "Whole Foods", cat: "Groceries", amount: -86.4, icon: ShoppingCart, color: "#22C55E" },
  { title: "Salary", cat: "Income", amount: 2480.0, icon: Briefcase, color: "#22C55E", income: true },
  { title: "Olive & Vine", cat: "Dining", amount: -52.18, icon: Utensils, color: "#F59E0B" },
];

export function HeroDashboard() {
  return (
    <div className="cf-card w-full overflow-hidden p-5 sm:p-6">
      {/* header row */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-content-muted">Total balance</p>
          <p className="text-2xl font-extrabold text-content">{formatCurrency(55349.87)}</p>
        </div>
        <span className="cf-chip bg-income/10 text-income">+12.4% this month</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Income vs Expenses */}
        <div className="rounded-2xl bg-surface-2 p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-content">Income vs Expenses</p>
            <div className="flex gap-3 text-[11px] font-semibold text-content-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-income" /> Income
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-expense" /> Expenses
              </span>
            </div>
          </div>
          <div style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer>
              <BarChart data={CHART} barGap={3} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--chart-axis)", fontSize: 10, fontWeight: 600 }}
                />
                <Bar dataKey="income" fill="#22C55E" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accounts — wide enough so numbers never wrap */}
        <div className="rounded-2xl bg-surface-2 p-4 lg:col-span-2">
          <p className="mb-3 text-sm font-bold text-content">Accounts</p>
          <ul className="space-y-2.5">
            {ACCOUNTS.map((a) => (
              <li key={a.name} className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${a.accent}1f`, color: a.accent }}
                >
                  <a.icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-content">{a.name}</p>
                  <p className="truncate text-[10px] text-content-muted">{a.inst}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs font-extrabold tabular-nums text-content">
                  {formatCurrency(a.balance)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <p className="mb-2.5 text-sm font-bold text-content">Recent transactions</p>
        <ul className="space-y-1">
          {RECENT.map((t) => (
            <li key={t.title} className="flex items-center gap-3 py-1">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${t.color}1f`, color: t.color }}
              >
                <t.icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-content">{t.title}</p>
                <p className="text-[10px] text-content-muted">{t.cat}</p>
              </div>
              <span
                className={`shrink-0 whitespace-nowrap text-xs font-extrabold tabular-nums ${
                  t.income ? "text-income" : "text-expense"
                }`}
              >
                {t.income ? "+" : "−"}
                {formatCurrency(Math.abs(t.amount))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
