import { useMemo, useState } from "react";
import {
  Plus,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Scale,
  Pencil,
  Trash2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard, EmptyState } from "../../components/ui/widgets";
import {
  TransactionModal,
  type TxDraft,
} from "../../components/forms/TransactionModal";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../hooks/useData";
import { db } from "../../lib/backend";
import { totalsAll } from "../../lib/finance";
import { CATEGORY_NAMES, getCategory } from "../../lib/categories";
import { cn, formatCurrency, formatDate } from "../../lib/utils";
import type { Transaction } from "../../lib/types";

type Filter = "all" | "income" | "expense" | "subscription";

export default function Transactions() {
  const { user } = useAuth();
  const { transactions } = useData();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const totals = totalsAll(transactions);

  const filtered = useMemo(() => {
    let rows = [...transactions];
    if (filter === "income") rows = rows.filter((t) => t.type === "income");
    else if (filter === "expense")
      rows = rows.filter((t) => t.type === "expense" && !t.is_subscription);
    else if (filter === "subscription") rows = rows.filter((t) => t.is_subscription);

    if (category !== "all") rows = rows.filter((t) => t.category === category);

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.vendor.toLowerCase().includes(q) ||
          (t.source ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) =>
      sort === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
    return rows;
  }, [transactions, filter, category, search, sort]);

  function handleSave(draft: TxDraft) {
    if (!user) return;
    const payload = {
      title: draft.title.trim(),
      vendor: draft.vendor.trim() || draft.title.trim(),
      amount: Math.abs(parseFloat(draft.amount) || 0),
      type: draft.type,
      category: draft.category,
      date: draft.date,
      notes: draft.notes.trim(),
      source: draft.bank_account,
      bank_account: draft.bank_account,
    };
    if (editing) db.transactions.update(user.id, editing.id, payload);
    else db.transactions.create(user.id, payload);
    setModalOpen(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (!user) return;
    db.transactions.remove(user.id, id);
  }

  function exportCsv() {
    const header = ["Date", "Title", "Vendor", "Category", "Type", "Amount", "Account"];
    const rows = filtered.map((t) => [
      t.date,
      t.title,
      t.vendor,
      t.category,
      t.type,
      (t.type === "expense" ? "-" : "") + t.amount.toFixed(2),
      t.bank_account ?? "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearfunds-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expenses" },
    { key: "subscription", label: "Subscriptions" },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every transaction in one clear, searchable view."
        actions={
          <>
            <button className="cf-btn-ghost" onClick={exportCsv}>
              <Download size={16} /> Export
            </button>
            <button
              className="cf-btn-primary"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Transaction
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Income" value={formatCurrency(totals.income)} icon={TrendingUp} tint="#22C55E" />
        <StatCard label="Total Expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} tint="#EF4444" />
        <StatCard label="Net Balance" value={formatCurrency(totals.net)} icon={Scale} tint="#2563EB" />
      </div>

      {/* Filters */}
      <div className="mt-5 cf-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition",
                  filter === f.key
                    ? "bg-brand text-white"
                    : "bg-surface-2 text-content-secondary hover:text-content",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                className="cf-input pl-9"
                placeholder="Search title or vendor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="cf-input w-auto"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="cf-input w-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 cf-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No transactions found"
            description="Try adjusting your filters, or add your first transaction to get started."
            action={
              <button className="cf-btn-primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Add Transaction
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const cat = getCategory(t.category);
              const Icon = t.is_subscription ? RefreshCw : cat.icon;
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-surface-2 sm:px-5"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${cat.color}1f`, color: cat.color }}
                  >
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-content">{t.title}</p>
                    <p className="truncate text-xs text-content-muted">
                      {formatDate(t.date)} · {t.vendor}
                      {t.bank_account ? ` · ${t.bank_account}` : ""}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span
                      className="cf-chip"
                      style={{ background: `${cat.color}1a`, color: cat.color }}
                    >
                      {t.category}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "w-24 shrink-0 text-right text-sm font-extrabold tabular-nums sm:w-28",
                      t.type === "income" ? "text-income" : "text-expense",
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount).replace("$", "$")}
                  </span>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(t);
                        setModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-content-muted hover:bg-surface hover:text-brand"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded-lg p-2 text-content-muted hover:bg-surface hover:text-expense"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
      />
    </>
  );
}
