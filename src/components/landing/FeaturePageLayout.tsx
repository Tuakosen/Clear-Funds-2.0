import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";
import { ShowcaseRow } from "./blocks";
import { useAuth } from "../../context/AuthContext";

export interface FeatureSection {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
  visual: ReactNode;
}

export function FeaturePageLayout({
  eyebrow,
  heroIcon: HeroIcon,
  heroTitle,
  heroSubtitle,
  accent,
  sections,
}: {
  eyebrow: string;
  heroIcon: LucideIcon;
  heroTitle: string;
  heroSubtitle: string;
  accent: string;
  sections: FeatureSection[];
}) {
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
            background: `radial-gradient(800px 420px at 50% -10%, ${accent}28, transparent)`,
          }}
        />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${accent}22`, color: accent }}
          >
            <HeroIcon size={32} />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-content sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-content-secondary sm:text-xl">
            {heroSubtitle}
          </p>
          <button className="cf-btn-primary mt-8 px-6 py-3 text-base" onClick={getStarted}>
            Get started <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-7xl space-y-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {sections.map((s, i) => (
          <ShowcaseRow
            key={s.title}
            icon={s.icon}
            title={s.title}
            description={s.description}
            bullets={s.bullets}
            visual={s.visual}
            flip={i % 2 === 1}
          />
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl px-8 py-12 text-center sm:px-16"
          style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB 55%, #1E3A8A)" }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready for clearer finances?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Start free and see the difference ClearFunds makes.
          </p>
          <button
            onClick={getStarted}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-brand shadow-lg transition hover:bg-blue-50"
          >
            Get started free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
