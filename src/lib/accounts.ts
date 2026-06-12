import type { BankAccount, Transaction } from "./types";
import { totalsAll } from "./finance";
import { seedDemoData } from "./data/env";

export type AccountKind = "checking" | "savings" | "investments";

export interface DisplayAccount {
  id: string;
  name: string;
  institution: string;
  balance: number;
  accent: string;
  type: AccountKind;
}

const ACCENT: Record<AccountKind, string> = {
  checking: "#2563EB",
  savings: "#40D6C9",
  investments: "#8B5CF6",
};

// Map a Plaid account (type/subtype) to a ClearFunds account kind.
// Credit cards and loans are intentionally excluded from the Accounts card.
function kindFor(a: BankAccount): AccountKind | null {
  const subtype = (a.subtype ?? "").toLowerCase();
  const type = (a.type ?? "").toLowerCase();
  if (type === "investment" || type === "brokerage" || subtype === "brokerage")
    return "investments";
  if (subtype === "savings") return "savings";
  if (type === "depository") return subtype === "savings" ? "savings" : "checking";
  if (type === "credit" || type === "loan") return null; // excluded
  return "checking";
}

// Real accounts synced from Plaid → display rows (no credit/loan).
export function toDisplayAccounts(accounts: BankAccount[]): DisplayAccount[] {
  return accounts
    .map((a) => {
      const type = kindFor(a);
      if (!type) return null;
      return {
        id: a.id,
        name: a.name || a.official_name || "Account",
        institution: a.institution || "Linked bank",
        balance: Number(a.current_balance ?? 0),
        accent: ACCENT[type],
        type,
      } satisfies DisplayAccount;
    })
    .filter((a): a is DisplayAccount => a !== null);
}

// Demo accounts (development / mock mode only). NO credit card here.
export function demoAccounts(transactions: Transaction[]): DisplayAccount[] {
  const { net } = totalsAll(transactions);
  return [
    {
      id: "demo-checking",
      name: "Everyday Checking",
      institution: "ClearFunds Bank",
      balance: Math.max(0, Math.round((4280 + net * 0.18) * 100) / 100),
      accent: ACCENT.checking,
      type: "checking",
    },
    {
      id: "demo-savings",
      name: "High-Yield Savings",
      institution: "ClearFunds Bank",
      balance: 18650.42,
      accent: ACCENT.savings,
      type: "savings",
    },
    {
      id: "demo-investments",
      name: "Investments",
      institution: "Vanguard",
      balance: 32418.9,
      accent: ACCENT.investments,
      type: "investments",
    },
  ];
}

// Resolve the accounts to display: real Plaid accounts in production, demo
// accounts only in development / mock mode.
export function resolveAccounts(
  bankAccounts: BankAccount[],
  transactions: Transaction[],
): DisplayAccount[] {
  if (seedDemoData) return demoAccounts(transactions);
  return toDisplayAccounts(bankAccounts);
}

export function sumBalance(accounts: DisplayAccount[]): number {
  return Math.round(accounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
}
