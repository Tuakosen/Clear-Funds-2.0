import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingDown,
  ShieldCheck,
  TrendingUp,
  Building2,
  PiggyBank,
  LineChart,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard, SectionCard, Pill } from "../../components/ui/widgets";
import { IncomeExpensesChart } from "../../components/charts/IncomeExpensesChart";
import { CategoryDonut } from "../../components/charts/CategoryDonut";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../hooks/useData";
import {
  monthlySeries,
  safeToSpend,
  spendingByCategory,
  totalsForMonth,
  upcomingBills,
} from "../../lib/finance";
import { getAccounts, totalBalance } from "../../lib/accounts";
import {
  cn,
  formatCurrency,
  formatDate,
  monthKey,
  monthLabel,
  daysUntil,
} from "../../lib/utils";
import { getCategory } from "../../lib/categories";

const ACCOUNT_ICONS = {
  checking: Building2,
  savings: PiggyBank,
  investments: LineChart,
} as const;

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, subscriptions } = useData();
  const month = monthKey();

  const totals = totalsForMonth(transactions, month);
  const series = monthlySeries(transactions, 6);
  const categorySlices = spendingByCategory(transactions, month);
  const accounts = getAccounts(transactions);
  const balance = totalBalance(transactions);
  const sts = safeToSpend(transactions, subscriptions, month);
  const bills = upcomingBills(subscriptions, 30).slice(0, 5);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={`Here's your money overview for ${monthLabel(month)}.`}
        actions={
          <Link to="/app/transactions" className="cf-btn-primary hidden sm:inline-flex">
            View transactions <ArrowRight size={16} />
          </Link>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(balance)}
          icon={Wallet}
          tint="#2563EB"
          hint="Across all linked accounts"
        />
        <StatCard
          label="Monthly Spending"
          value={formatCurrency(totals.expenses)}
          icon={TrendingDown}
          tint="#EF4444"
          hint={monthLabel(month)}
        />
        <StatCard
          label="Safe to Spend"
          value={formatCurrency(sts)}
          icon={ShieldCheck}
          tint="#40D6C9"
          hint="After bills & subscriptions"
        />
        <StatCard
          label="Monthly Income"
          value={formatCurrency(totals.income)}
          icon={TrendingUp}
          tint="#22C55E"
          hint={monthLabel(month)}
        />
      </div>

      {/* Charts row */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard
          title="Income vs Expenses"
          className="xl:col-span-2"
          action={
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-content-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-income" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-content-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-expense" /> Expenses
              </span>
            </div>
          }
        >
          <IncomeExpensesChart data={series} />
        </SectionCard>

        <SectionCard title="Spending by Category">
          <CategoryDonut data={categorySlices} />
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Accounts */}
        <SectionCard
          title="Accounts"
          action={
            <Pill tone="brand">
              <ShieldCheck size={12} /> Read-only
            </Pill>
          }
        >
          <ul className="space-y-3">
            {accounts.map((acct) => {
              const Icon = ACCOUNT_ICONS[acct.type];
              return (
                <li
                  key={acct.name}
                  className="flex items-center gap-4 rounded-xl bg-surface-2 p-3.5"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${acct.accent}1f`, color: acct.accent }}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-content">{acct.name}</p>
                    <p className="truncate text-xs text-content-muted">{acct.institution}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-base font-extrabold tabular-nums text-content">
                    {formatCurrency(acct.balance)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border px-4 py-3">
            <span className="text-sm font-semibold text-content-secondary">
              Total balance
            </span>
            <span className="text-base font-extrabold text-content">
              {formatCurrency(balance)}
            </span>
          </div>
        </SectionCard>

        {/* Upcoming Bills */}
        <SectionCard
          title="Upcoming Bills"
          action={
            <Link
              to="/app/subscriptions"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Manage
            </Link>
          }
        >
          {bills.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 text-sm text-content-secondary">
              <CalendarClock size={18} className="text-content-muted" />
              No bills due in the next 30 days.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {bills.map((bill) => {
                const cat = getCategory(bill.category);
                const days = daysUntil(bill.next_billing_date);
                return (
                  <li
                    key={bill.id}
                    className="flex items-center gap-3.5 rounded-xl bg-surface-2 p-3"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${cat.color}1f`, color: cat.color }}
                    >
                      <cat.icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-content">{bill.name}</p>
                      <p className="text-xs text-content-muted">
                        {formatDate(bill.next_billing_date)} ·{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            days <= 3 ? "text-expense" : "text-content-secondary",
                          )}
                        >
                          {days <= 0 ? "Due today" : `in ${days} day${days === 1 ? "" : "s"}`}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums text-content">
                      {formatCurrency(bill.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
