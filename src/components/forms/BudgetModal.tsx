import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { CATEGORIES, ICON_OPTIONS, getCategory } from "../../lib/categories";
import { cn } from "../../lib/utils";
import type { Budget } from "../../lib/types";

export interface BudgetDraft {
  category: string;
  limit: string;
  icon: string;
  color: string;
  alerts_enabled: boolean;
}

export function BudgetModal({
  open,
  onClose,
  onSave,
  editing,
  usedCategories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: BudgetDraft) => void;
  editing?: Budget | null;
  usedCategories: string[];
}) {
  const [draft, setDraft] = useState<BudgetDraft>({
    category: "Groceries",
    limit: "",
    icon: "groceries",
    color: "#22C55E",
    alerts_enabled: true,
  });

  useEffect(() => {
    if (editing) {
      setDraft({
        category: editing.category,
        limit: String(editing.limit),
        icon: editing.icon,
        color: editing.color,
        alerts_enabled: editing.alerts_enabled,
      });
    } else {
      const firstFree =
        CATEGORIES.find((c) => !usedCategories.includes(c.name)) ?? CATEGORIES[0];
      setDraft({
        category: firstFree.name,
        limit: "",
        icon: firstFree.iconKey,
        color: firstFree.color,
        alerts_enabled: true,
      });
    }
  }, [editing, open]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickCategory(name: string) {
    const cat = getCategory(name);
    setDraft((d) => ({ ...d, category: name, icon: cat.iconKey, color: cat.color }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.limit) return;
    onSave(draft);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit budget" : "Add budget"}
      description="Budgets track spending in a category against a monthly limit."
      footer={
        <>
          <button className="cf-btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="cf-btn-primary" form="budget-form" type="submit">
            {editing ? "Save budget" : "Create budget"}
          </button>
        </>
      }
    >
      <form id="budget-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="cf-label">Category</label>
          <select
            className="cf-input"
            value={draft.category}
            onChange={(e) => pickCategory(e.target.value)}
            disabled={!!editing}
          >
            {CATEGORIES.map((c) => (
              <option
                key={c.name}
                value={c.name}
                disabled={!editing && usedCategories.includes(c.name)}
              >
                {c.name}
                {!editing && usedCategories.includes(c.name) ? " (in use)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cf-label">Monthly limit</label>
          <input
            type="number"
            min="0"
            step="1"
            className="cf-input"
            placeholder="500"
            value={draft.limit}
            onChange={(e) => setDraft((d) => ({ ...d, limit: e.target.value }))}
            autoFocus
          />
        </div>

        <div>
          <label className="cf-label">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, icon: key }))}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition",
                  draft.icon === key
                    ? "text-white"
                    : "bg-surface-2 text-content-secondary hover:text-content",
                )}
                style={
                  draft.icon === key
                    ? { background: draft.color }
                    : undefined
                }
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-content">
              Overspending alerts
            </span>
            <span className="block text-xs text-content-muted">
              Notify me when I approach this limit.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={draft.alerts_enabled}
            onClick={() =>
              setDraft((d) => ({ ...d, alerts_enabled: !d.alerts_enabled }))
            }
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              draft.alerts_enabled ? "bg-brand" : "bg-content-muted/40",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                draft.alerts_enabled ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </label>
      </form>
    </Modal>
  );
}
