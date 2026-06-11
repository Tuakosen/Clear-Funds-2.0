import { RefreshCw, CalendarClock, TrendingUp, PauseCircle, ScanSearch } from "lucide-react";
import { FeaturePageLayout } from "../../components/landing/FeaturePageLayout";
import { SubscriptionsMock } from "../../components/landing/mocks";

export default function SubscriptionsFeature() {
  return (
    <FeaturePageLayout
      eyebrow="Subscriptions"
      heroIcon={RefreshCw}
      accent="#40D6C9"
      heroTitle="Take control of subscriptions and recurring bills"
      heroSubtitle="ClearFunds finds your recurring charges, flags price changes, and reminds you before renewals hit—so subscriptions never surprise you again."
      sections={[
        {
          icon: ScanSearch,
          title: "See every recurring charge",
          description:
            "ClearFunds scans your transactions and detects recurring payments automatically, surfacing subscriptions you may have forgotten.",
          bullets: ["Automatic subscription detection", "Detected from your transactions", "Add suggestions in one tap"],
          visual: <SubscriptionsMock />,
        },
        {
          icon: CalendarClock,
          title: "Know what's renewing soon",
          description:
            "Upcoming charges and renewals this week keep you ahead of every bill, with reminders before money leaves your account.",
          bullets: ["Upcoming charge reminders", "Renewals this week", "Monthly & annual totals"],
          visual: <SubscriptionsMock />,
        },
        {
          icon: TrendingUp,
          title: "Spot price changes",
          description:
            "We track each subscription's price over time and flag increases, so a quiet price bump never slips past you.",
          bullets: ["Price-change awareness", "Price history tracking", "Increase alerts"],
          visual: <SubscriptionsMock />,
        },
        {
          icon: PauseCircle,
          title: "Pause, cancel, or review subscriptions",
          description:
            "Pause what you're not using, mark what you've canceled, and rate usage—keeping recurring spend intentional.",
          bullets: ["Active / paused / canceled status", "Usage awareness", "One place to manage it all"],
          visual: <SubscriptionsMock />,
        },
      ]}
    />
  );
}
