import { Receipt, Wallet, RefreshCw, type LucideIcon } from "lucide-react";

export interface FeatureColumn {
  key: string;
  to: string;
  icon: LucideIcon;
  heading: string;
  description: string;
  bullets: string[];
}

export const FEATURE_COLUMNS: FeatureColumn[] = [
  {
    key: "tracking",
    to: "/features/tracking",
    icon: Receipt,
    heading: "Tracking",
    description:
      "See all your transactions and account activity in one clear, searchable view.",
    bullets: [
      "Unified transaction feed",
      "Automatic categorization",
      "Spending insights and trends",
    ],
  },
  {
    key: "budgeting",
    to: "/features/budgeting",
    icon: Wallet,
    heading: "Budgeting",
    description:
      "Flexible budgeting tools that adapt to real life, not rigid spreadsheets.",
    bullets: [
      "Category-based budgets",
      "Real-time budget tracking",
      "Alerts and overspending awareness",
    ],
  },
  {
    key: "subscriptions",
    to: "/features/subscriptions",
    icon: RefreshCw,
    heading: "Subscriptions",
    description:
      "Stay on top of recurring bills and subscriptions before they surprise you.",
    bullets: [
      "Subscription detection",
      "Upcoming charges",
      "Cancellation awareness",
    ],
  },
];
