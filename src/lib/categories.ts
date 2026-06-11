import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Heart,
  Film,
  Plane,
  GraduationCap,
  Shirt,
  Smartphone,
  PiggyBank,
  Briefcase,
  Gift,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  name: string;
  icon: LucideIcon;
  color: string;
  iconKey: string;
}

// Single source of truth — shared by Transactions, Budgets, Insights.
export const CATEGORIES: CategoryDef[] = [
  { name: "Groceries", icon: ShoppingCart, color: "#22C55E", iconKey: "groceries" },
  { name: "Dining", icon: Utensils, color: "#F59E0B", iconKey: "dining" },
  { name: "Transport", icon: Car, color: "#3B82F6", iconKey: "transport" },
  { name: "Housing", icon: Home, color: "#8B5CF6", iconKey: "housing" },
  { name: "Utilities", icon: Zap, color: "#EAB308", iconKey: "utilities" },
  { name: "Health", icon: Heart, color: "#EF4444", iconKey: "health" },
  { name: "Entertainment", icon: Film, color: "#EC4899", iconKey: "entertainment" },
  { name: "Travel", icon: Plane, color: "#06B6D4", iconKey: "travel" },
  { name: "Education", icon: GraduationCap, color: "#6366F1", iconKey: "education" },
  { name: "Shopping", icon: Shirt, color: "#F97316", iconKey: "shopping" },
  { name: "Subscriptions", icon: Smartphone, color: "#40D6C9", iconKey: "subscriptions" },
  { name: "Savings", icon: PiggyBank, color: "#14B8A6", iconKey: "savings" },
  { name: "Income", icon: Briefcase, color: "#22C55E", iconKey: "income" },
  { name: "Gifts", icon: Gift, color: "#D946EF", iconKey: "gifts" },
  { name: "Other", icon: CreditCard, color: "#64748B", iconKey: "other" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

const byName = new Map(CATEGORIES.map((c) => [c.name, c]));
const byKey = new Map(CATEGORIES.map((c) => [c.iconKey, c]));

export function getCategory(name: string): CategoryDef {
  return (
    byName.get(name) ?? {
      name,
      icon: Sparkles,
      color: "#64748B",
      iconKey: "other",
    }
  );
}

export function getIconByKey(key: string): LucideIcon {
  return byKey.get(key)?.icon ?? Sparkles;
}

export const ICON_OPTIONS = CATEGORIES.map((c) => ({
  key: c.iconKey,
  icon: c.icon,
}));
