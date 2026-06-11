import { Wallet, ShieldCheck, PieChart, Gauge, CalendarCheck } from "lucide-react";
import { FeaturePageLayout } from "../../components/landing/FeaturePageLayout";
import { BudgetsMock, SpendingMock } from "../../components/landing/mocks";

export default function Budgeting() {
  return (
    <FeaturePageLayout
      eyebrow="Budgeting"
      heroIcon={Wallet}
      accent="#22C55E"
      heroTitle="Budgeting that adapts to real life"
      heroSubtitle="Flexible, category-based budgets that update automatically from your transactions—not rigid spreadsheets you have to babysit."
      sections={[
        {
          icon: ShieldCheck,
          title: "One clear number to guide your spending",
          description:
            "Your Safe to Spend figure tells you exactly how much is left after bills and subscriptions—so you can spend with confidence.",
          bullets: ["Safe to Spend at a glance", "Accounts for fixed bills", "Updates in real time"],
          visual: <BudgetsMock />,
        },
        {
          icon: PieChart,
          title: "See exactly where your money is going",
          description:
            "Category budgets are calculated by scanning your transactions, so usage is always accurate. Change a category and the budget updates itself.",
          bullets: ["Category-based budgets", "Auto-calculated from transactions", "Used, remaining & percentage"],
          visual: <SpendingMock />,
        },
        {
          icon: Gauge,
          title: "Know where you stand at a glance",
          description:
            "Real-time progress bars and overspending alerts keep you aware—without the spreadsheet anxiety.",
          bullets: ["Real-time budget tracking", "Overspending alerts", "Overall progress view"],
          visual: <BudgetsMock />,
        },
        {
          icon: CalendarCheck,
          title: "Monthly review and smart adjustments",
          description:
            "Copy last month in a click, apply smart suggestions based on your last 90 days, and let Pro auto-adjust limits to your real run-rate.",
          bullets: ["Smart budget suggestions", "Copy last month", "Auto-adjust for Pro"],
          visual: <SpendingMock />,
        },
      ]}
    />
  );
}
