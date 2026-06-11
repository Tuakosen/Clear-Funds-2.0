import { useMemo, useState } from "react";
import {
  Plus,
  Sparkles,
  Copy,
  Wand2,
  Pencil,
  Trash2,
  TrendingUp,
  Receipt,
  Wallet,
  ShieldCheck,
  Lock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionCard, ProgressBar, Pill, EmptyState } from "../../components/ui/widgets";
import { BudgetModal, type BudgetDraft } from "../../components/forms/BudgetModal";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../hooks/useData";
import { db } from "../../lib/backend";
import {
  computeBudgetUsage,
  fixedBills,
  safeToSpend,
  suggestBudgets,
  totalsForMonth,
} from "../../lib/finance";
import { getCategory, getIconByKey } from "../../lib/categories";
import { cn, formatCurrency, monthKey, monthLabel } from "../../lib/utils";
import type { Budget } from "../../lib/types";

export default function Budgets() {
  const { user } = useAuth();
  const { transactions, budgets, subscriptions } = useData();
  const month = monthKey();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const monthBudgets = budgets.filter((b) => b.month === month);
  const usages = useMemo(
    () => monthBudgets.map((b) => computeBudgetUsage(b, transactions, month)),
    [monthBudgets, transactions, month],
  );

  const totals = totalsForMonth(transactions, month);
  const bills = fixedBills(transactions, subscriptions, month);
  const sts = safeToSpend(transactions, subscriptions, month);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.limit, 0);
  const totalUsed = usages.reduce((s, u) => s + u.used, 0);
  const overallPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

  const suggestions = useMemo(() => suggestBudgets(transactions), [transactions]);
  const usedCategories = monthBudgets.map((b) => b.category);

  function handleSave(draft: BudgetDraft) {
    if (!user) return;
    const payload = {
      category: draft.category,
      limit: parseFloat(draft.limit) || 0,
      month,
      icon: draft.icon,
      color: draft.color,
      alerts_enabled: draft.alerts_enabled,
    };
    if (editing) db.budgets.update(user.id, editing.id, payload);
    else db.budgets.create(user.id, payload);
    setModalOpen(false);
    setEditing(null);
  }

  function applyAllSuggestions() {
    if (!user) return;
    suggestions
      .filter((s) => !usedCategories.includes(s.category))
      .forEach((s) => {
        const cat = getCategory(s.category);
        db.budgets.create(user.id, {
          category: s.category,
          limit: s.suggested,
          month,
          icon: cat.iconKey,
          color: cat.color,
          alerts_enabled: true,
        });
      });
    setSuggestOpen(false);
  }

  function copyLastMonth() {
    if (!user) return;
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    const prevKey = monthKey(prev);
    const prevBudgets = budgets.filter((b) => b.month === prevKey);
    prevBudgets.forEach((b) => {
      if (usedCategories.includes(b.category)) return;
      db.budgets.create(user.id, { ...b, month } as Omit<Budget, "id" | "user_id">);
    });
    if (prevBudgets.length === 0) setSuggestOpen(true);
  }

  function autoAdjust() {
    if (!user || user.plan !== "pro") return;
    usages.forEach((u) => {
      // Nudge limits toward actual spend (smooth, 30% toward current run-rate).
      const target = Math.round((u.budget.limit * 0.7 + u.used * 0.3) / 5) * 5;
      db.budgets.update(user.id, u.budget.id, { limit: Math.max(20, target) });
    });
  }

  const overview = [
    { label: "Monthly Income", value: totals.income, icon: TrendingUp, tint: "#22C55E" },
    { label: "Fixed Bills", value: bills, icon: Receipt, tint: "#8B5CF6" },
    { label: "Current Spending", value: totals.expenses, icon: Wallet, tint: "#EF4444" },
    { label: "Safe to Spend", value: sts, icon: ShieldCheck, tint: "#40D6C9" },
  ];

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle={`Category budgets for ${monthLabel(month)}, tracked from your transactions.`}
        actions={
          <>
            <button className="cf-btn-ghost" onClick={copyLastMonth}>
              <Copy size={16} /> Copy Last Month
            </button>
            <button className="cf-btn-ghost" onClick={() => setSuggestOpen(true)}>
              <Sparkles size={16} /> Suggestions
            </button>
            <button
              className="cf-btn-primary"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Budget
            </button>
          </>
        }
      />

      {/* Overview tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overview.map((o) => (
          <div key={o.label} className="cf-card p-4">
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${o.tint}1a`, color: o.tint }}
            >
              <o.icon size={17} />
            </div>
            <p className="text-xs font-medium text-content-muted">{o.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-content">
              {formatCurrency(o.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Overall progress + auto adjust */}
      <SectionCard
        className="mt-5"
        title="Overall Progress"
        action={
          <AutoAdjustButton plan={user?.plan} onClick={autoAdjust} />
        }
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-content-secondary">
              {formatCurrency(totalUsed)} of {formatCurrency(totalBudget)} used
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              Total Budget across {monthBudgets.length} categories
            </p>
          </div>
          <span
            className={cn(
              "text-2xl font-extrabold",
              overallPct > 100 ? "text-expense" : "text-content",
            )}
          >
            {overallPct}%
          </span>
        </div>
        <ProgressBar value={overallPct} color="#2563EB" className="mt-3 h-2.5" />
      </SectionCard>

      {/* Budget cards */}
      {monthBudgets.length === 0 ? (
        <div className="mt-5 cf-card">
          <EmptyState
            icon={Target}
            title="No budgets yet"
            description="Create category budgets, or apply smart suggestions based on your spending."
            action={
              <div className="flex gap-3">
                <button className="cf-btn-ghost" onClick={() => setSuggestOpen(true)}>
                  <Sparkles size={16} /> Smart Suggestions
                </button>
                <button className="cf-btn-primary" onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add Budget
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {usages.map((u) => {
            const Icon = getIconByKey(u.budget.icon);
            return (
              <div key={u.budget.id} className="group cf-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: `${u.budget.color}1f`,
                        color: u.budget.color,
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-content">
                        {u.budget.category}
                      </p>
                      <p className="text-xs text-content-muted">
                        {formatCurrency(u.budget.limit)} limit
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(u.budget);
                        setModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-content-muted hover:text-brand"
                      aria-label="Edit budget"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => user && db.budgets.remove(user.id, u.budget.id)}
                      className="rounded-lg p-1.5 text-content-muted hover:text-expense"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-content">
                    {formatCurrency(u.used)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      u.over ? "text-expense" : "text-content-secondary",
                    )}
                  >
                    {u.pct}%
                  </span>
                </div>
                <ProgressBar value={u.pct} color={u.budget.color} className="mt-2" />
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-content-muted">
                    {u.over ? "Over by " : "Remaining "}
                    <span
                      className={cn(
                        "font-bold",
                        u.over ? "text-expense" : "text-income",
                      )}
                    >
                      {formatCurrency(Math.abs(u.remaining))}
                    </span>
                  </span>
                  {u.over && u.budget.alerts_enabled && (
                    <Pill tone="expense">
                      <AlertTriangle size={11} /> Over budget
                    </Pill>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
        usedCategories={usedCategories}
      />

      {/* Suggestions modal */}
      <Modal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="Smart Budget Suggestions"
        description="Recommended limits based on your last 90 days of spending."
        size="lg"
        footer={
          <>
            <button className="cf-btn-ghost" onClick={() => setSuggestOpen(false)}>
              Close
            </button>
            <button
              className="cf-btn-primary"
              onClick={applyAllSuggestions}
              disabled={suggestions.every((s) => usedCategories.includes(s.category))}
            >
              <Wand2 size={16} /> Apply all suggestions
            </button>
          </>
        }
      >
        {suggestions.length === 0 ? (
          <p className="text-sm text-content-secondary">
            Not enough spending history yet. Add some transactions first.
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => {
              const cat = getCategory(s.category);
              const exists = usedCategories.includes(s.category);
              return (
                <li
                  key={s.category}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${cat.color}1f`, color: cat.color }}
                  >
                    <cat.icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-content">{s.category}</p>
                    <p className="text-xs text-content-muted">
                      Avg {formatCurrency(s.avgMonthly)}/mo
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-content">
                    {formatCurrency(s.suggested)}
                  </span>
                  {exists && <Pill tone="brand">Added</Pill>}
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
}

function AutoAdjustButton({
  plan,
  onClick,
}: {
  plan?: string;
  onClick: () => void;
}) {
  const isPro = plan === "pro";
  return (
    <button
      onClick={onClick}
      disabled={!isPro}
      title={isPro ? "Auto-adjust limits to your run-rate" : "Pro feature"}
      className={cn(
        "cf-chip font-semibold transition",
        isPro
          ? "bg-pro/10 text-pro hover:bg-pro/20"
          : "cursor-not-allowed bg-surface-2 text-content-muted",
      )}
    >
      {isPro ? <Wand2 size={13} /> : <Lock size={12} />} Auto Adjust
      {!isPro && " (Pro)"}
    </button>
  );
}
