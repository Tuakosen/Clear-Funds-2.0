import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "../ui/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";
import { FeatureDropdown } from "./FeatureDropdown";
import { FEATURE_COLUMNS } from "./featureData";
import { useAuth } from "../../context/AuthContext";

export function LandingHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Signed in → Dashboard. Signed out → sign-up flow.
  function getStarted() {
    navigate(user ? "/app" : "/signup");
  }

  const NAV = [
    { label: "Pricing", to: "/pricing" },
    { label: "Security", to: "/security" },
    { label: "Resources", to: "/security" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            <FeatureDropdown />
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-content-secondary transition hover:text-content"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link
            to={user ? "/app" : "/signin"}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-content-secondary transition hover:text-content"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <button className="cf-btn-primary" onClick={getStarted}>
            Get started
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-content-secondary"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 lg:hidden">
          <p className="cf-label">Features</p>
          <div className="mb-3 space-y-1">
            {FEATURE_COLUMNS.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-content-secondary"
              >
                <c.icon size={17} className="text-brand" />
                {c.heading}
              </Link>
            ))}
          </div>
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-2 py-2 text-sm font-semibold text-content-secondary"
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Link
              to={user ? "/app" : "/signin"}
              onClick={() => setMobileOpen(false)}
              className="cf-btn-ghost"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <button className="cf-btn-primary" onClick={getStarted}>
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
