import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { cn } from "../../lib/utils";

const FREE = [
  "Up to 2 linked accounts",
  "Transaction tracking",
  "Basic budgets",
  "Subscription detection",
];

const PRO = [
  "Unlimited accounts",
  "Smart budgets & alerts",
  "Powerful reporting",
  "Subscription price tracking",
  "AI insights & forecasts",
  "Priority support",
];

export function PricingCards({ onSelect }: { onSelect: () => void }) {
  const [yearly, setYearly] = useState(false);
  const proPrice = yearly ? "7.50" : "9.99";

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-semibold", !yearly ? "text-content" : "text-content-muted")}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={yearly}
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative h-7 w-12 rounded-full transition",
            yearly ? "bg-brand" : "bg-content-muted/40",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
              yearly ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
        <span className={cn("text-sm font-semibold", yearly ? "text-content" : "text-content-muted")}>
          Yearly <span className="text-income">save 25%</span>
        </span>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="cf-card flex flex-col p-7">
          <h3 className="text-lg font-bold text-content">Free</h3>
          <p className="mt-1 text-sm text-content-secondary">Everything to get started.</p>
          <p className="mt-5">
            <span className="text-4xl font-extrabold text-content">$0</span>
            <span className="text-content-muted">/month</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {FREE.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-content-secondary">
                <Check size={16} className="text-content-muted" /> {f}
              </li>
            ))}
          </ul>
          <button className="cf-btn-ghost mt-7" onClick={onSelect}>
            Get started free
          </button>
        </div>

        {/* Pro */}
        <div
          className="relative flex flex-col rounded-2xl p-7 text-white"
          style={{ background: "linear-gradient(160deg, #2563EB, #1E3A8A)" }}
        >
          <span className="absolute right-6 top-6 cf-chip bg-white/15 text-white">
            <Crown size={12} /> Most popular
          </span>
          <h3 className="text-lg font-bold">Pro</h3>
          <p className="mt-1 text-sm text-blue-100">For people serious about their money.</p>
          <p className="mt-5">
            <span className="text-4xl font-extrabold">${proPrice}</span>
            <span className="text-blue-200">/month{yearly && ", billed yearly"}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {PRO.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-blue-50">
                <Check size={16} className="text-teal-accent" /> {f}
              </li>
            ))}
          </ul>
          <button
            className="mt-7 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-blue-50"
            onClick={onSelect}
          >
            Start free trial
          </button>
        </div>
      </div>
    </div>
  );
}
