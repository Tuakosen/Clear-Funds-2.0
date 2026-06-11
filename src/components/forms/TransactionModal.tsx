import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { CATEGORY_NAMES } from "../../lib/categories";
import { isoFromDate } from "../../lib/utils";
import type { Transaction, TransactionType } from "../../lib/types";

export interface TxDraft {
  title: string;
  vendor: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  bank_account: string;
}

const EMPTY: TxDraft = {
  title: "",
  vendor: "",
  amount: "",
  type: "expense",
  category: "Groceries",
  date: isoFromDate(new Date()),
  notes: "",
  bank_account: "Checking",
};

export function TransactionModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: TxDraft) => void;
  editing?: Transaction | null;
}) {
  const [draft, setDraft] = useState<TxDraft>(EMPTY);

  useEffect(() => {
    if (editing) {
      setDraft({
        title: editing.title,
        vendor: editing.vendor,
        amount: String(editing.amount),
        type: editing.type,
        category: editing.category,
        date: editing.date,
        notes: editing.notes ?? "",
        bank_account: editing.bank_account ?? "Checking",
      });
    } else {
      setDraft(EMPTY);
    }
  }, [editing, open]);

  function set<K extends keyof TxDraft>(key: K, value: TxDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.amount) return;
    onSave(draft);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Add transaction"}
      description="Transactions update your dashboard, budgets, and insights automatically."
      footer={
        <>
          <button className="cf-btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="cf-btn-primary" form="tx-form" type="submit">
            {editing ? "Save changes" : "Add transaction"}
          </button>
        </>
      }
    >
      <form id="tx-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`cf-btn capitalize ${
                draft.type === t
                  ? t === "income"
                    ? "bg-income/15 text-income"
                    : "bg-expense/15 text-expense"
                  : "cf-btn-ghost"
              }`}
              style={
                draft.type === t
                  ? { border: `1px solid ${t === "income" ? "#22C55E" : "#EF4444"}` }
                  : undefined
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="cf-label">Title</label>
          <input
            className="cf-input"
            placeholder="Weekly groceries"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cf-label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="cf-input"
              placeholder="0.00"
              value={draft.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>
          <div>
            <label className="cf-label">Date</label>
            <input
              type="date"
              className="cf-input"
              value={draft.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="cf-label">Vendor / Source</label>
            <input
              className="cf-input"
              placeholder="Whole Foods"
              value={draft.vendor}
              onChange={(e) => set("vendor", e.target.value)}
            />
          </div>
          <div>
            <label className="cf-label">Category</label>
            <select
              className="cf-input"
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="cf-label">Account</label>
          <select
            className="cf-input"
            value={draft.bank_account}
            onChange={(e) => set("bank_account", e.target.value)}
          >
            {["Checking", "Savings", "Investments"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cf-label">Notes (optional)</label>
          <textarea
            className="cf-input min-h-[72px] resize-none"
            placeholder="Add a note…"
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
