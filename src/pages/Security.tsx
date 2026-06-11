import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  Link2,
  Users,
  KeyRound,
  ShieldOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingFooter } from "../components/landing/LandingFooter";
import { SectionHeading } from "../components/landing/blocks";
import { useAuth } from "../context/AuthContext";

const PILLARS = [
  {
    icon: Lock,
    title: "Bank-level encryption",
    desc: "Your data is encrypted in transit and at rest using industry-standard AES-256 and TLS, the same protection trusted by major banks.",
  },
  {
    icon: Eye,
    title: "Read-only connections",
    desc: "ClearFunds can see your balances and transactions but can never move money. Connections are strictly read-only.",
  },
  {
    icon: Link2,
    title: "Plaid-powered connectivity",
    desc: "We connect to your bank through Plaid, a trusted leader in financial data connectivity. (Integration placeholder in this build.)",
  },
  {
    icon: Users,
    title: "User-scoped data",
    desc: "Every record is scoped to your account. Your data is isolated and only ever visible to you.",
  },
  {
    icon: KeyRound,
    title: "No password visibility",
    desc: "We never see or store your bank credentials. Authentication happens securely through your bank, not through us.",
  },
  {
    icon: ShieldOff,
    title: "We never sell your data",
    desc: "Your financial data is yours. We don't sell it, rent it, or share it with advertisers—ever.",
  },
];

export default function Security() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(800px 400px at 50% -10%, rgba(64,214,201,0.16), transparent)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-accent/15 text-teal-accent">
            <ShieldCheck size={32} />
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-content sm:text-5xl">
            Your money's clarity, protected
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-content-secondary">
            Security isn't a feature at ClearFunds—it's the foundation. Here's how we keep
            your financial data safe.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="cf-card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <p.icon size={24} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-content">{p.title}</h3>
              <p className="mt-2 text-content-secondary">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <SectionHeading
          title="Connect with confidence"
          subtitle="When the Plaid integration goes live, linking an account takes seconds—and ClearFunds never touches your credentials."
        />
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(user ? "/app/settings" : "/signup")}
            className="cf-btn-primary px-6 py-3 text-base"
          >
            {user ? "Manage connections" : "Get started securely"} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
