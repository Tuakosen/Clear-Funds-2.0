import { Receipt, Search, Sparkles, Wallet, Layers } from "lucide-react";
import { FeaturePageLayout } from "../../components/landing/FeaturePageLayout";
import { TransactionsMock, SpendingMock } from "../../components/landing/mocks";

export default function Tracking() {
  return (
    <FeaturePageLayout
      eyebrow="Tracking"
      heroIcon={Receipt}
      accent="#2563EB"
      heroTitle="See every transaction, clearly"
      heroSubtitle="A unified, searchable view of all your transactions and account activity—organized automatically so you always know where your money went."
      sections={[
        {
          icon: Layers,
          title: "All your spending, in one place",
          description:
            "Bring every account together into a single, beautifully organized feed. No more jumping between apps to understand your money.",
          bullets: ["Unified transaction feed", "Every account in one view", "Income in green, expenses in red"],
          visual: <TransactionsMock />,
        },
        {
          icon: Sparkles,
          title: "Transactions that organize themselves",
          description:
            "ClearFunds automatically categorizes each transaction, so your spending sorts itself into clear, meaningful groups.",
          bullets: ["Automatic categorization", "Smart vendor recognition", "Editable any time"],
          visual: <SpendingMock />,
        },
        {
          icon: Search,
          title: "Find any transaction in seconds",
          description:
            "Search by title or vendor, filter by type or category, and sort by date. The transaction you need is always a moment away.",
          bullets: ["Instant search", "Category & type filters", "Newest / oldest sorting"],
          visual: <TransactionsMock />,
        },
        {
          icon: Wallet,
          title: "Understand your habits, not just your balance",
          description:
            "Spending insights and trends turn raw transactions into a clear story of how you really spend—so you can make better decisions.",
          bullets: ["Spending insights & trends", "Category breakdowns", "Month-over-month context"],
          visual: <SpendingMock />,
        },
      ]}
    />
  );
}
