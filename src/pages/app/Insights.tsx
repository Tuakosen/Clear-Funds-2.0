import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Sparkles,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  LineChart as LineChartIcon,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionCard, ProgressBar, Pill } from "../../components/ui/widgets";
import { useData } from "../../hooks/useData";
import {
  monthlySeries,
  spendingByCategory,
  subscriptionTotals,
  totalsForMonth,
} from "../../lib/finance";
import { getCategory } from "../../lib/categories";
import { seedDemoData } from "../../lib/data/env";
import {
  cn,
  formatCurrency,
  formatCurrencyShort,
  monthKey,
  monthLabel,
} from "../../lib/utils";

export default function Insights() {
  const { transactions, subscriptions } = useData();
  const month = monthKey();
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);
  const prevKey = monthKey(prev);

  const cur = totalsForMonth(transactions, month);
  const last = totalsForMonth(transactions, prevKey);
  const series = monthlySeries(transactions, 6);
  const topCats = spendingByCategory(transactions, month).slice(0, 5);
  const subs = subscriptionTotals(subscriptions);

  const savingsRate = cur.income > 0 ? Math.round((cur.net / cur.income) * 100) : 0;

  // Forecast: average daily spend × days in month.
  const dayOfMonth = new Date().getDate();
  const forecastExpenses =
    dayOfMonth > 0 ? Math.round((cur.expenses / dayOfMonth) * 30) : cur.expenses;

  // What changed vs last month, by category.
  const changes = useMemo(() => {
    const curCats = new Map(
      spendingByCategory(transactions, month).map((c) => [c.name, c.value]),
    );
    const prevCats = new Map(
      spendingByCategory(transactions, prevKey).map((c) => [c.name, c.value]),
    );
    const names = new Set([...curCats.keys(), ...prevCats.keys()]);
    return Array.from(names)
      .map((name) => {
        const now = curCats.get(name) ?? 0;
        const before = prevCats.get(name) ?? 0;
        return { name, delta: now - before, now, before };
      })
      .filter((c) => Math.abs(c.delta) > 5)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
  }, [transactions, month, prevKey]);

  // Anomalies: single transactions far above category average.
  const anomalies = useMemo(() => {
    const byCat = new Map<string, number[]>();
    transactions
      .filter((t) => t.type === "expense" && t.date.slice(0, 7) === month)
      .forEach((t) => {
        if (!byCat.has(t.category)) byCat.set(t.category, []);
        byCat.get(t.category)!.push(t.amount);
      });
    const out: { title: string; category: string; amount: number; avg: number }[] = [];
    transactions
      .filter((t) => t.type === "expense" && t.date.slice(0, 7) === month)
      .forEach((t) => {
        const arr = byCat.get(t.category)!;
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        if (arr.length >= 3 && t.amount > avg * 2.2 && t.amount > 80) {
          out.push({ title: t.title, category: t.category, amount: t.amount, avg });
        }
      });
    return out.sort((a, b) => b.amount - a.amount).slice(0, 4);
  }, [transactions, month]);

  // Savings goals — demo targets only; real users start with none.
  const goals = seedDemoData
    ? [
        { name: "Emergency Fund", target: 10000, saved: 6800, color: "#40D6C9" },
        { name: "Vacation 2026", target: 3500, saved: 1450, color: "#8B5CF6" },
        { name: "New Laptop", target: 2200, saved: 1980, color: "#2563EB" },
      ]
    : [];

  const incomeDelta = pctChange(cur.income, last.income);
  const expenseDelta = pctChange(cur.expenses, last.expenses);
  const netDelta = pctChange(cur.net, last.net);

  // Simple natural-language AI-style analysis from the numbers.
  const aiPoints = buildAnalysis({
    savingsRate,
    expenseDelta,
    topCat: topCats[0]?.name,
    subsMonthly: subs.monthly,
    forecastExpenses,
    income: cur.income,
  });

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle={`Your financial story for ${monthLabel(month)}.`}
      />

      {/* Monthly overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard label="Income" value={cur.income} delta={incomeDelta} icon={TrendingUp} tint="#22C55E" positiveGood />
        <OverviewCard label="Expenses" value={cur.expenses} delta={expenseDelta} icon={TrendingDown} tint="#EF4444" positiveGood={false} />
        <OverviewCard label="Net Savings" value={cur.net} delta={netDelta} icon={PiggyBank} tint="#2563EB" positiveGood />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 6-month trends */}
        <SectionCard title="6-Month Trends" className="lg:col-span-2">
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="ins-income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ins-expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} dy={6} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip formatter={(v: number, n) => [formatCurrency(v), n === "income" ? "Income" : "Expenses"]} />
                <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2.5} fill="url(#ins-income)" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} fill="url(#ins-expense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Forecast + savings rate */}
        <SectionCard title="Forecast">
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-xs font-medium text-content-muted">Projected month-end spending</p>
            <p className="mt-1 text-2xl font-extrabold text-content">
              {formatCurrency(forecastExpenses)}
            </p>
            <p className="mt-1 text-xs text-content-secondary">
              Based on your pace so far this month.
            </p>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-content-secondary">Savings rate</span>
              <span className={cn("font-extrabold", savingsRate >= 20 ? "text-income" : "text-content")}>
                {savingsRate}%
              </span>
            </div>
            <ProgressBar value={savingsRate} color="#40D6C9" className="mt-2" />
            <p className="mt-2 text-xs text-content-muted">
              {savingsRate >= 20
                ? "Great — you're saving above the recommended 20%."
                : "Aim for 20%+ to build a healthy cushion."}
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top categories */}
        <SectionCard title="Top Spending Categories">
          <ul className="space-y-3">
            {topCats.map((c) => {
              const cat = getCategory(c.name);
              const max = topCats[0].value || 1;
              return (
                <li key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-content">
                      <cat.icon size={15} style={{ color: cat.color }} />
                      {c.name}
                    </span>
                    <span className="font-bold text-content">{formatCurrency(c.value)}</span>
                  </div>
                  <ProgressBar value={(c.value / max) * 100} color={cat.color} />
                </li>
              );
            })}
            {topCats.length === 0 && (
              <p className="text-sm text-content-muted">No spending recorded yet.</p>
            )}
          </ul>
        </SectionCard>

        {/* What changed */}
        <SectionCard title="What Changed" action={<Pill tone="neutral">vs {monthLabel(prevKey).split(" ")[0]}</Pill>}>
          {changes.length === 0 ? (
            <p className="text-sm text-content-muted">Spending is steady versus last month.</p>
          ) : (
            <ul className="space-y-2.5">
              {changes.map((c) => {
                const cat = getCategory(c.name);
                const up = c.delta > 0;
                return (
                  <li key={c.name} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${cat.color}1f`, color: cat.color }}>
                      <cat.icon size={16} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-content">{c.name}</p>
                      <p className="text-xs text-content-muted">
                        {formatCurrency(c.before)} → {formatCurrency(c.now)}
                      </p>
                    </div>
                    <span className={cn("flex items-center gap-1 text-sm font-bold", up ? "text-expense" : "text-income")}>
                      {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      {formatCurrency(Math.abs(c.delta))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Savings goals */}
        <SectionCard title="Savings Goals" action={<Pill tone="brand"><Target size={12} /> {goals.length} active</Pill>}>
          {goals.length === 0 ? (
            <p className="text-sm text-content-muted">
              No savings goals yet. Create one to start tracking progress.
            </p>
          ) : (
          <ul className="space-y-4">
            {goals.map((g) => {
              const pct = Math.round((g.saved / g.target) * 100);
              return (
                <li key={g.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-content">{g.name}</span>
                    <span className="text-content-secondary">
                      {formatCurrency(g.saved)}{" "}
                      <span className="text-content-muted">/ {formatCurrency(g.target)}</span>
                    </span>
                  </div>
                  <ProgressBar value={pct} color={g.color} />
                </li>
              );
            })}
          </ul>
          )}
        </SectionCard>

        {/* Subscriptions summary + anomalies */}
        <SectionCard title="Subscriptions Summary">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-2 p-4">
              <RefreshCw size={18} className="text-teal-accent" />
              <p className="mt-2 text-xs text-content-muted">Monthly</p>
              <p className="text-lg font-extrabold text-content">{formatCurrency(subs.monthly)}</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-4">
              <LineChartIcon size={18} className="text-pro" />
              <p className="mt-2 text-xs text-content-muted">Annualized</p>
              <p className="text-lg font-extrabold text-content">{formatCurrency(subs.annual)}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-content">
              <AlertTriangle size={15} className="text-amber-500" /> Anomalies
            </p>
            {anomalies.length === 0 ? (
              <p className="text-sm text-content-muted">No unusual transactions detected.</p>
            ) : (
              <ul className="space-y-2">
                {anomalies.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                    <span className="truncate text-content-secondary">
                      {a.title} <span className="text-content-muted">· {a.category}</span>
                    </span>
                    <span className="font-bold text-expense">{formatCurrency(a.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      </div>

      {/* AI analysis */}
      <SectionCard
        className="mt-5"
        title="AI Analysis"
        action={<Pill tone="pro"><Sparkles size={12} /> Generated</Pill>}
      >
        <ul className="space-y-3">
          {aiPoints.map((p, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-surface-2 p-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pro/15 text-pro">
                <Sparkles size={13} />
              </span>
              <p className="text-sm text-content-secondary">{p}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}

function pctChange(now: number, before: number): number {
  if (before === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - before) / Math.abs(before)) * 100);
}

function OverviewCard({
  label,
  value,
  delta,
  icon: Icon,
  tint,
  positiveGood,
}: {
  label: string;
  value: number;
  delta: number;
  icon: typeof TrendingUp;
  tint: string;
  positiveGood: boolean;
}) {
  const good = positiveGood ? delta >= 0 : delta <= 0;
  return (
    <div className="cf-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${tint}1a`, color: tint }}>
          <Icon size={20} />
        </div>
        <span className={cn("cf-chip", good ? "bg-income/10 text-income" : "bg-expense/10 text-expense")}>
          {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta)}% vs last month
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-content-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-content">{formatCurrency(value)}</p>
    </div>
  );
}

function buildAnalysis(d: {
  savingsRate: number;
  expenseDelta: number;
  topCat?: string;
  subsMonthly: number;
  forecastExpenses: number;
  income: number;
}): string[] {
  const points: string[] = [];
  points.push(
    d.savingsRate >= 20
      ? `You're saving ${d.savingsRate}% of your income this month — comfortably above the recommended 20%. Keep routing the surplus toward your goals.`
      : `Your savings rate is ${d.savingsRate}%. Trimming a few discretionary categories could lift you toward the 20% target.`,
  );
  if (d.topCat) {
    points.push(
      `${d.topCat} is your largest spending category this month. It's worth a quick review to make sure it still reflects your priorities.`,
    );
  }
  points.push(
    d.expenseDelta > 8
      ? `Spending is up ${d.expenseDelta}% versus last month. Your projected month-end total is ${formatCurrency(d.forecastExpenses)} — pacing slightly higher than usual.`
      : d.expenseDelta < -8
        ? `Nice work — spending is down ${Math.abs(d.expenseDelta)}% versus last month. You're on track for around ${formatCurrency(d.forecastExpenses)}.`
        : `Your spending is steady, on pace for roughly ${formatCurrency(d.forecastExpenses)} by month-end.`,
  );
  points.push(
    `Subscriptions cost about ${formatCurrency(d.subsMonthly)}/month. Reviewing low-usage services is the fastest way to reclaim recurring spend.`,
  );
  return points;
}
