import type { Transaction } from "./types";
import { totalsAll } from "./finance";

export interface Account {
  name: string;
  type: "checking" | "savings" | "investments";
  institution: string;
  balance: number;
  accent: string;
}

// Mock Plaid-style balances. Checking is nudged by overall net activity so the
// dashboard feels connected to the user's transactions. NO credit card here.
export function getAccounts(transactions: Transaction[]): Account[] {
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
