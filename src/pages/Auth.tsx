import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Auth({ mode }: { mode: "signin" | "signup" }) {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = (location.state as { from?: string })?.from ?? "/app";

  // Already signed in → straight to the app.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const isSignup = mode === "signup";

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (isSignup) await signUp(name.trim() || "ClearFunds User", email.trim(), password);
      else await signIn(email.trim(), password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div
        className="relative hidden flex-col justify-between p-12 lg:flex"
        style={{
          background:
            "linear-gradient(155deg, #1D4ED8 0%, #2563EB 45%, #1E3A8A 100%)",
        }}
      >
        <Logo className="[&_span]:text-white" />
        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Clarity for your money, from day one.
          </h2>
          <p className="mt-4 text-blue-100">
            ClearFunds brings your spending, budgets, and subscriptions into one
            calm, beautifully simple command center.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-blue-50">
            {[
              "Bank-level encryption & read-only connections",
              "Smart budgets that adapt to real life",
              "Subscription detection & price-change alerts",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-teal-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-blue-200">
          © {new Date().getFullYear()} ClearFunds — Transparency made simple.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm cf-fade-up">
            <h1 className="text-2xl font-extrabold text-content">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-content-secondary">
              {isSignup
                ? "Start free, upgrade any time. No credit card required."
                : "Sign in to your ClearFunds dashboard."}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {isSignup && (
                <div>
                  <label className="cf-label">Full name</label>
                  <div className="relative">
                    <UserIcon
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
                    />
                    <input
                      className="cf-input pl-10"
                      placeholder="Jordan Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="cf-label">Email address</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
                  />
                  <input
                    type="email"
                    required
                    className="cf-input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="cf-label">Password</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
                  />
                  <input
                    type="password"
                    className="cf-input pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="cf-btn-primary w-full">
                {submitting
                  ? "Please wait…"
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
                <ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-content-secondary">
              {isSignup ? "Already have an account?" : "New to ClearFunds?"}{" "}
              <Link
                to={isSignup ? "/signin" : "/signup"}
                className="font-semibold text-brand hover:underline"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-content-muted">
              <Lock size={11} className="mr-1 inline" />
              Demo auth — your data stays private on this device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
