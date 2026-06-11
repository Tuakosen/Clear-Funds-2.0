import { useMemo, useState } from "react";
import {
  Plus,
  CalendarDays,
  CalendarRange,
  Bell,
  Pause,
  Play,
  Pencil,
  Trash2,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard, SectionCard, Pill, EmptyState } from "../../components/ui/widgets";
import {
  SubscriptionModal,
  type SubDraft,
} from "../../components/forms/SubscriptionModal";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../hooks/useData";
import { db } from "../../lib/backend";
import {
  detectRecurring,
  subscriptionTotals,
  upcomingBills,
} from "../../lib/finance";
import { getCategory } from "../../lib/categories";
import {
  cn,
  daysUntil,
  formatCurrency,
  formatDate,
  isoFromDate,
} from "../../lib/utils";
import type { Subscription } from "../../lib/types";

type Tab = "active" | "paused" | "all";

export default function Subscriptions() {
  const { user } = useAuth();
  const { transactions, subscriptions } = useData();
  const [tab, setTab] = useState<Tab>("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [prefill, setPrefill] = useState<Partial<SubDraft> | null>(null);

  const totals = subscriptionTotals(subscriptions);
  const renewalsThisWeek = upcomingBills(subscriptions, 7);
  const recurring = useMemo(
    () => detectRecurring(transactions, subscriptions),
    [transactions, subscriptions],
  );

  const filtered = subscriptions.filter((s) =>
    tab === "all" ? true : s.status === tab,
  );

  function handleSave(draft: SubDraft) {
    if (!user) return;
    const amount = parseFloat(draft.amount) || 0;
    const payload = {
      name: draft.name.trim(),
      amount,
      currentPrice: amount,
      currency: "USD",
      billing_cycle: draft.billing_cycle,
      category: draft.category,
      next_billing_date: draft.next_billing_date,
      logo_url: draft.logo_url.trim() || undefined,
      status: (editing?.status ?? "active") as Subscription["status"],
      reminder_days: 3,
    };
    if (editing) db.subscriptions.update(user.id, editing.id, payload);
    else
      db.subscriptions.create(user.id, {
        ...payload,
        basePrice: amount,
        priceHistory: [{ date: isoFromDate(new Date()), price: amount }],
      });
    setModalOpen(false);
    setEditing(null);
    setPrefill(null);
  }

  function togglePause(s: Subscription) {
    if (!user) return;
    db.subscriptions.update(user.id, s.id, {
      status: s.status === "paused" ? "active" : "paused",
    });
  }

  function addFromRecurring(r: (typeof recurring)[number]) {
    setEditing(null);
    setPrefill({
      name: r.vendor,
      amount: String(r.amount),
      category: r.category,
      billing_cycle: "monthly",
    });
    setModalOpen(true);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "all", label: "All" },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Stay on top of recurring bills before they surprise you."
        actions={
          <button
            className="cf-btn-primary"
            onClick={() => {
              setEditing(null);
              setPrefill(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Subscription
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Monthly Total" value={formatCurrency(totals.monthly)} icon={CalendarDays} tint="#2563EB" hint={`${totals.activeCount} active`} />
        <StatCard label="Annual Total" value={formatCurrency(totals.annual)} icon={CalendarRange} tint="#8B5CF6" />
        <StatCard label="Renewals This Week" value={String(renewalsThisWeek.length)} icon={Bell} tint="#F59E0B" hint="Next 7 days" />
      </div>

      {/* Detected recurring */}
      {recurring.length > 0 && (
        <SectionCard
          className="mt-5"
          title="Detected Recurring Charges"
          action={<Pill tone="brand"><Sparkles size={12} /> {recurring.length} found</Pill>}
        >
          <p className="-mt-2 mb-3 text-sm text-content-secondary">
            We spotted these repeating charges in your transactions. Add them to track renewals.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {recurring.map((r) => {
              const cat = getCategory(r.category);
              return (
                <div
                  key={r.vendor}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: `${cat.color}1f`, color: cat.color }}
                  >
                    <RefreshCw size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-content">{r.vendor}</p>
                    <p className="text-xs text-content-muted">
                      {formatCurrency(r.amount)} · {r.occurrences}× seen
                    </p>
                  </div>
                  <button
                    className="cf-btn-ghost px-3 py-1.5 text-xs"
                    onClick={() => addFromRecurring(r)}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Tabs */}
      <div className="mt-5 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-brand text-white"
                : "bg-surface-2 text-content-secondary hover:text-content",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="mt-5 cf-card">
          <EmptyState
            icon={RefreshCw}
            title="No subscriptions here"
            description="Add a subscription or import one from your detected recurring charges."
            action={
              <button className="cf-btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Add Subscription
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const cat = getCategory(s.category);
            const days = daysUntil(s.next_billing_date);
            const priceUp =
              s.basePrice !== undefined &&
              s.currentPrice !== undefined &&
              s.currentPrice > s.basePrice;
            return (
              <div key={s.id} className="cf-card flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? (
                      <img
                        src={s.logo_url}
                        alt=""
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-extrabold text-white"
                        style={{ background: cat.color }}
                      >
                        {s.name[0]?.toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-bold text-content">{s.name}</p>
                      <p className="text-xs text-content-muted">{s.category}</p>
                    </div>
                  </div>
                  {s.status === "paused" ? (
                    <Pill tone="warn">Paused</Pill>
                  ) : s.status === "canceled" ? (
                    <Pill tone="expense">Canceled</Pill>
                  ) : (
                    <Pill tone="income">Active</Pill>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-content">
                    {formatCurrency(s.amount)}
                  </span>
                  <span className="text-xs font-medium text-content-muted">
                    /{s.billing_cycle.replace("ly", "")}
                  </span>
                  {priceUp && (
                    <span className="ml-auto">
                      <Pill tone="expense">
                        <TrendingUp size={11} /> Price up
                      </Pill>
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-content-secondary">
                  {s.status === "active" ? (
                    <>
                      Next charge {formatDate(s.next_billing_date)} ·{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          days <= 3 ? "text-expense" : "text-content-secondary",
                        )}
                      >
                        {days <= 0 ? "due today" : `in ${days} days`}
                      </span>
                    </>
                  ) : (
                    "Billing paused"
                  )}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => togglePause(s)}
                    className="cf-btn-ghost flex-1 px-3 py-1.5 text-xs"
                  >
                    {s.status === "paused" ? (
                      <>
                        <Play size={13} /> Resume
                      </>
                    ) : (
                      <>
                        <Pause size={13} /> Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(s);
                      setModalOpen(true);
                    }}
                    className="rounded-lg p-2 text-content-muted hover:bg-surface-2 hover:text-brand"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => user && db.subscriptions.remove(user.id, s.id)}
                    className="rounded-lg p-2 text-content-muted hover:bg-surface-2 hover:text-expense"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SubscriptionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setPrefill(null);
        }}
        onSave={handleSave}
        editing={editing}
        prefill={prefill}
      />
    </>
  );
}
