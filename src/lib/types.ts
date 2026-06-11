// ===== ClearFunds data entities (all scoped by user_id) =====

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  vendor: string;
  amount: number; // always positive; sign derived from `type`
  type: TransactionType;
  category: string;
  date: string; // ISO yyyy-mm-dd
  notes?: string;
  source?: string;
  bank_account?: string;
  is_subscription?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit: number;
  month: string; // yyyy-mm
  icon: string;
  color: string;
  alerts_enabled: boolean;
}

export type SubscriptionStatus = "active" | "paused" | "canceled";
export type BillingCycle = "monthly" | "yearly" | "weekly" | "quarterly";

export interface PricePoint {
  date: string;
  price: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  basePrice?: number;
  currentPrice?: number;
  lastPriceChangeAt?: string;
  priceHistory?: PricePoint[];
  currency: string;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  category: string;
  status: SubscriptionStatus;
  logo_url?: string;
  usage_rating?: number; // 1-5
  cancellation_date?: string;
  reminder_days?: number;
  last_known_price?: number;
}

export interface UserInsight {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown>;
  generated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  avatarColor?: string;
}
