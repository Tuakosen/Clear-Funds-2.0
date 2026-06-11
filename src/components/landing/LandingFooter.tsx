import { Link } from "react-router-dom";
import { Logo } from "../ui/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Tracking", to: "/features/tracking" },
      { label: "Budgeting", to: "/features/budgeting" },
      { label: "Subscriptions", to: "/features/subscriptions" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Security", to: "/security" },
      { label: "Resources", to: "/security" },
      { label: "About", to: "/" },
      { label: "Contact", to: "/" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign in", to: "/signin" },
      { label: "Create account", to: "/signup" },
      { label: "Dashboard", to: "/app" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-content-secondary">
              Transparency made simple. Track spending, manage budgets, and understand
              your finances—all in one place.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold text-content">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-content-secondary transition hover:text-brand"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-content-muted sm:flex-row">
          <p>© {new Date().getFullYear()} ClearFunds. All rights reserved.</p>
          <p>Bank-level security • Read-only connections</p>
        </div>
      </div>
    </footer>
  );
}
