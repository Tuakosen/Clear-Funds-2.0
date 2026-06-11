import { useNavigate } from "react-router-dom";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingFooter } from "../components/landing/LandingFooter";
import { SectionHeading } from "../components/landing/blocks";
import { PricingCards } from "../components/landing/PricingCards";
import { useAuth } from "../context/AuthContext";

const FAQ = [
  {
    q: "Can I switch plans any time?",
    a: "Yes. Start free and upgrade to Pro whenever you're ready—your data comes with you. You can downgrade at any time too.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. ClearFunds uses bank-level encryption and read-only connections. We never see your bank password and never sell your data.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan requires no payment details. You only add billing when you choose to upgrade to Pro.",
  },
  {
    q: "What's included in Pro?",
    a: "Unlimited accounts, smart budgets and alerts, powerful reporting, subscription price tracking, AI insights, and priority support.",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getStarted = () => navigate(user ? "/app" : "/signup");

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade any time"
          subtitle="Simple, transparent pricing. Unlimited accounts, smart budgets & alerts, powerful reporting, and priority support on Pro."
        />
        <div className="mt-12">
          <PricingCards onSelect={getStarted} />
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-content">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="cf-card p-6">
                <h3 className="font-bold text-content">{item.q}</h3>
                <p className="mt-2 text-content-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
