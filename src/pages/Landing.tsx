import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Receipt,
  Wallet,
  RefreshCw,
  LineChart,
  Target,
  Sparkles,
  Building2,
  Check,
  Lock,
} from "lucide-react";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingFooter } from "../components/landing/LandingFooter";
import { HeroDashboard } from "../components/landing/HeroDashboard";
import { SectionHeading, ShowcaseRow } from "../components/landing/blocks";
import {
  TransactionsMock,
  BudgetsMock,
  SubscriptionsMock,
  SpendingMock,
} from "../components/landing/mocks";
import { PricingCards } from "../components/landing/PricingCards";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getStarted = () => navigate(user ? "/app" : "/signup");

  return (
    <div className="min-h-screen">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 500px at 80% -10%, rgba(64,214,201,0.18), transparent), radial-gradient(800px 500px at 10% 10%, rgba(37,99,235,0.16), transparent)",
          }}
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
          <div className="cf-fade-up">
            <span className="cf-chip bg-brand/10 text-brand">
              <Sparkles size={13} /> Transparency made simple
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-content sm:text-5xl lg:text-6xl">
              Clarity For <span className="text-brand">Your Money</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-content-secondary sm:text-xl">
              Track spending, manage budgets, and understand your finances—all in one
              place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button className="cf-btn-primary px-6 py-3 text-base" onClick={getStarted}>
                Get started <ArrowRight size={18} />
              </button>
              <a href="#features" className="cf-btn-ghost px-6 py-3 text-base">
                View features
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-content-muted">
              <Lock size={14} className="text-teal-accent" />
              Bank-level security • Read-only connections
            </p>
          </div>

          <div className="cf-fade-up lg:pl-4">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* Everything you need */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to stay in control"
          subtitle="ClearFunds brings tracking, budgeting, and subscriptions together in one calm, beautifully simple command center."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: Receipt, title: "Track", desc: "See every transaction across every account in one searchable feed." },
            { icon: Wallet, title: "Budget", desc: "Category budgets that adapt to real life and update in real time." },
            { icon: LineChart, title: "Plan", desc: "Insights, forecasts, and trends that turn data into decisions." },
          ].map((f) => (
            <div key={f.title} className="cf-card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <f.icon size={24} />
              </span>
              <h3 className="mt-4 text-xl font-bold text-content">{f.title}</h3>
              <p className="mt-2 text-content-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase rows */}
      <section className="space-y-20 bg-surface/40 py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          <ShowcaseRow
            icon={Building2}
            eyebrow="Overview"
            title="Your whole financial picture, at a glance"
            description="Checking, savings, and investments together with a clear total balance—no credit-card clutter, just clarity."
            bullets={["Unified account overview", "Real-time total balance", "Read-only & secure"]}
            visual={<SpendingMock />}
          />
          <ShowcaseRow
            icon={Receipt}
            eyebrow="Transactions"
            title="See every transaction, clearly"
            description="A unified, searchable feed that organizes itself, so you always know where your money went."
            bullets={["Automatic categorization", "Powerful search & filters", "Income in green, expenses in red"]}
            visual={<TransactionsMock />}
            flip
          />
          <ShowcaseRow
            icon={Wallet}
            eyebrow="Budgets"
            title="Budgeting that adapts to real life"
            description="One clear number to guide your spending, with category budgets that update automatically from your transactions."
            bullets={["Category-based budgets", "Real-time tracking", "Overspending alerts"]}
            visual={<BudgetsMock />}
          />
          <ShowcaseRow
            icon={RefreshCw}
            eyebrow="Subscriptions"
            title="Take control of recurring bills"
            description="ClearFunds detects recurring charges, flags price changes, and reminds you before renewals hit."
            bullets={["Automatic detection", "Upcoming charge reminders", "Price-change awareness"]}
            visual={<SubscriptionsMock />}
            flip
          />
        </div>
      </section>

      {/* Reports / Goals */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Insights & Goals"
          title="Reports that turn numbers into decisions"
          subtitle="Monthly overviews, 6-month trends, forecasts, and savings goals—so you always know where you stand and where you're headed."
        />
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: LineChart, title: "6-month trends", desc: "Spot patterns in income and spending over time." },
            { icon: Sparkles, title: "AI analysis", desc: "Plain-language takeaways from your numbers." },
            { icon: Target, title: "Savings goals", desc: "Track progress toward what matters." },
            { icon: ShieldCheck, title: "Anomaly alerts", desc: "Catch unusual charges before they add up." },
          ].map((f) => (
            <div key={f.title} className="cf-card p-5">
              <f.icon size={22} className="text-brand" />
              <h3 className="mt-3 font-bold text-content">{f.title}</h3>
              <p className="mt-1.5 text-sm text-content-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data connectivity / security band */}
      <section className="bg-surface/40 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="flex mx-auto h-14 w-14 items-center justify-center rounded-2xl bg-teal-accent/15 text-teal-accent">
            <ShieldCheck size={28} />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-content sm:text-4xl">
            Secure by design, connected by Plaid
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-content-secondary">
            Bank-level encryption and read-only connections mean ClearFunds can show your
            money without ever touching it. We never see your password and never sell your
            financial data.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {["Bank-level encryption", "Read-only connections", "User-scoped data", "No data selling"].map((t) => (
              <span key={t} className="cf-chip bg-surface text-content-secondary" style={{ border: "1px solid var(--card-border)" }}>
                <Check size={13} className="text-income" /> {t}
              </span>
            ))}
          </div>
          <Link to="/security" className="mt-7 inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
            Learn about our security <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade any time"
          subtitle="Simple, transparent pricing. No hidden fees, cancel whenever you like."
        />
        <div className="mt-12">
          <PricingCards onSelect={getStarted} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB 55%, #1E3A8A)" }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Bring clarity to your money today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Join ClearFunds and see your spending, budgets, and subscriptions in one calm
            command center.
          </p>
          <button
            onClick={getStarted}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand shadow-lg transition hover:bg-blue-50"
          >
            Get started free <ArrowRight size={18} />
          </button>
          <p className="mt-4 text-sm text-blue-200">Bank-level security • Read-only connections</p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
