import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { CATEGORY_NAMES } from "../../lib/categories";
import { isoFromDate } from "../../lib/utils";
import type { BillingCycle, Subscription } from "../../lib/types";

export interface SubDraft {
  name: string;
  amount: string;
  billing_cycle: BillingCycle;
  category: string;
  next_billing_date: string;
  logo_url: string;
}

const EMPTY: SubDraft = {
  name: "",
  amount: "",
  billing_cycle: "monthly",
  category: "Entertainment",
  next_billing_date: isoFromDate(new Date(Date.now() + 7 * 86400000)),
  logo_url: "",
};

export function SubscriptionModal({
  open,
  onClose,
  onSave,
  editing,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: SubDraft) => void;
  editing?: Subscription | null;
  prefill?: Partial<SubDraft> | null;
}) {
  const [draft, setDraft] = useState<SubDraft>(EMPTY);

  useEffect(() => {
    if (editing) {
      setDraft({
        name: editing.name,
        amount: String(editing.amount),
        billing_cycle: editing.billing_cycle,
        category: editing.category,
        next_billing_date: editing.next_billing_date,
        logo_url: editing.logo_url ?? "",
      });
    } else {
      setDraft({ ...EMPTY, ...prefill });
    }
  }, [editing, open]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof SubDraft>(key: K, value: SubDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.amount) return;
    onSave(draft);
  }

  const CYCLES: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit subscription" : "Add subscription"}
      description="Track recurring bills so they never surprise you."
      footer={
        <>
          <button className="cf-btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="cf-btn-primary" form="sub-form" type="submit">
            {editing ? "Save changes" : "Add subscription"}
          </button>
        </>
      }
    >
      <form id="sub-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="cf-label">Service name</label>
          <input
            className="cf-input"
            placeholder="Netflix"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
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
              placeholder="9.99"
              value={draft.amount}
              onChange={(e) => set("amount", e.target.value)}
            />
          </div>
          <div>
            <label className="cf-label">Billing cycle</label>
            <select
              className="cf-input capitalize"
              value={draft.billing_cycle}
              onChange={(e) => set("billing_cycle", e.target.value as BillingCycle)}
            >
              {CYCLES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="cf-label">Next billing date</label>
            <input
              type="date"
              className="cf-input"
              value={draft.next_billing_date}
              onChange={(e) => set("next_billing_date", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="cf-label">Logo URL (optional)</label>
          <input
            className="cf-input"
            placeholder="https://…"
            value={draft.logo_url}
            onChange={(e) => set("logo_url", e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
