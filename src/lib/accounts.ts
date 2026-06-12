import type { Transaction } from "./types";
import { totalsAll } from "./finance";
import { seedDemoData } from "./data/env";

export interface Account {
  name: string;
  type: "checking" | "savings" | "investments";
  institution: string;
  balance: number;
  accent: string;
}

// Demo Plaid-style balances, shown ONLY in demo/development mode. Real Supabase
// users start with no accounts (empty) until real balances are connected — so
// the dashboard reads $0.00 instead of fake demo balances. NO credit card here.
export function getAccounts(transactions: Transaction[]): Account[] {
  if (!seedDemoData) return [];
  const { net } = totalsAll(transactions);
  const checkingBase = 4280;
  return [
    {
      name: "Everyday Checking",
      type: "checking",
      institution: "ClearFunds Bank",
      balance: Math.max(0, Math.round((checkingBase + net * 0.18) * 100) / 100),
      accent: "#2563EB",
    },
    {
      name: "High-Yield Savings",
      type: "savings",
      institution: "ClearFunds Bank",
      balance: 18650.42,
      accent: "#40D6C9",
    },
    {
      name: "Investments",
      type: "investments",
      institution: "Vanguard",
      balance: 32418.9,
      accent: "#8B5CF6",
    },
  ];
}

export function totalBalance(transactions: Transaction[]): number {
  return getAccounts(transactions).reduce((s, a) => s + a.balance, 0);
}
