import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import { FEATURE_COLUMNS } from "./featureData";
import { cn } from "../../lib/utils";

export function FeatureDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function scheduleClose() {
    cancelClose();
    // Grace period so moving the mouse from the trigger into the panel keeps it open.
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <div
      ref={containerRef}
      className="static lg:relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
          open ? "text-brand" : "text-content-secondary hover:text-content",
        )}
      >
        Features
        <ChevronDown
          size={15}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="cf-scale-in absolute left-1/2 top-full z-40 mt-2 w-[min(92vw,860px)] -translate-x-1/2 cf-card p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FEATURE_COLUMNS.map((col) => (
              <Link
                key={col.key}
                to={col.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="group flex flex-col rounded-2xl p-4 transition hover:bg-surface-2"
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand/15">
                  <col.icon size={20} />
                </span>
                <span className="flex items-center gap-1.5 text-base font-bold text-content">
                  {col.heading}
                  <ArrowRight
                    size={14}
                    className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 text-brand"
                  />
                </span>
                <span className="mt-1 text-sm text-content-secondary">
                  {col.description}
                </span>
                <ul className="mt-3 space-y-1.5">
                  {col.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-xs font-medium text-content-muted"
                    >
                      <Check size={13} className="text-teal-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
