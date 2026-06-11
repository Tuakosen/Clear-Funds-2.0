import type { Budget, Subscription, Transaction } from "./types";
import { isoFromDate, monthKey, uid } from "./utils";

// Deterministic-ish pseudo random so seeded data looks stable per session.
function rand(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const EXPENSE_TEMPLATES: Array<{ title: string; vendor: string; category: string; min: number; max: number }> = [
  { title: "Weekly groceries", vendor: "Whole Foods", category: "Groceries", min: 48, max: 165 },
  { title: "Grocery run", vendor: "Trader Joe's", category: "Groceries", min: 30, max: 90 },
  { title: "Dinner out", vendor: "Olive & Vine", category: "Dining", min: 28, max: 96 },
  { title: "Morning coffee", vendor: "Blue Bottle", category: "Dining", min: 4, max: 12 },
  { title: "Lunch", vendor: "Sweetgreen", category: "Dining", min: 11, max: 22 },
  { title: "Rideshare", vendor: "Uber", category: "Transport", min: 9, max: 38 },
  { title: "Fuel", vendor: "Shell", category: "Transport", min: 32, max: 72 },
  { title: "Transit pass", vendor: "Metro Transit", category: "Transport", min: 25, max: 50 },
  { title: "Electricity bill", vendor: "PG&E", category: "Utilities", min: 60, max: 140 },
  { title: "Internet", vendor: "Xfinity", category: "Utilities", min: 55, max: 80 },
  { title: "Pharmacy", vendor: "CVS Pharmacy", category: "Health", min: 12, max: 65 },
  { title: "Gym membership", vendor: "Equinox", category: "Health", min: 40, max: 95 },
  { title: "Movie night", vendor: "AMC Theaters", category: "Entertainment", min: 14, max: 48 },
  { title: "New jacket", vendor: "Uniqlo", category: "Shopping", min: 35, max: 120 },
  { title: "Home supplies", vendor: "Target", category: "Shopping", min: 22, max: 88 },
  { title: "Online course", vendor: "Coursera", category: "Education", min: 19, max: 59 },
  { title: "Birthday gift", vendor: "Etsy", category: "Gifts", min: 25, max: 70 },
];

const SUBSCRIPTION_TX: Array<{ title: string; vendor: string; amount: number }> = [
  { title: "Netflix", vendor: "Netflix", amount: 15.49 },
  { title: "Spotify Premium", vendor: "Spotify", amount: 11.99 },
  { title: "iCloud+ Storage", vendor: "Apple", amount: 2.99 },
  { title: "Adobe Creative Cloud", vendor: "Adobe", amount: 22.99 },
];

export function seedTransactions(userId: string): Transaction[] {
  const txns: Transaction[] = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const isCurrent = m === 0;
    const daysInMonth = isCurrent
      ? now.getDate()
      : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    // Salary — twice a month, so income is present every month.
    const salary = rand(2350, 2600);
    txns.push(makeIncome(userId, monthDate, 1, "Salary", "Acme Corp", salary));
    if (daysInMonth >= 15) {
      txns.push(makeIncome(userId, monthDate, 15, "Salary", "Acme Corp", salary));
    }
    // Occasional side income.
    if (Math.random() > 0.45 && daysInMonth >= 20) {
      txns.push(
        makeIncome(userId, monthDate, rand(18, Math.min(daysInMonth, 26)), "Freelance project", "Upwork", rand(300, 850)),
      );
    }

    // Recurring subscriptions for the month.
    SUBSCRIPTION_TX.forEach((s, i) => {
      const day = 3 + i * 6;
      if (day <= daysInMonth) {
        txns.push({
          id: uid("tx"),
          user_id: userId,
          title: s.title,
          vendor: s.vendor,
          amount: s.amount,
          type: "expense",
          category: "Subscriptions",
          date: isoFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)),
          source: "Auto-pay",
          bank_account: "Checking",
          is_subscription: true,
        });
      }
    });

    // Variable expenses — spread across the month.
    const count = 14 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const t = pick(EXPENSE_TEMPLATES);
      const day = 1 + Math.floor(Math.random() * Math.max(1, daysInMonth));
      txns.push({
        id: uid("tx"),
        user_id: userId,
        title: t.title,
        vendor: t.vendor,
        amount: rand(t.min, t.max),
        type: "expense",
        category: t.category,
        date: isoFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)),
        source: pick(["Card", "Apple Pay", "Bank transfer"]),
        bank_account: pick(["Checking", "Checking", "Savings"]),
      });
    }

    // Rent — fixed bill.
    txns.push({
      id: uid("tx"),
      user_id: userId,
      title: "Monthly rent",
      vendor: "Sunset Apartments",
      amount: 1850,
      type: "expense",
      category: "Housing",
      date: isoFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)),
      source: "Bank transfer",
      bank_account: "Checking",
    });
  }

  return txns.sort((a, b) => b.date.localeCompare(a.date));
}

function makeIncome(
  userId: string,
  monthDate: Date,
  day: number,
  title: string,
  vendor: string,
  amount: number,
): Transaction {
  return {
    id: uid("tx"),
    user_id: userId,
    title,
    vendor,
    amount,
    type: "income",
    category: "Income",
    date: isoFromDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), day)),
    source: "Direct deposit",
    bank_account: "Checking",
  };
}

export function seedBudgets(userId: string): Budget[] {
  const month = monthKey();
  const defs: Array<[string, number, string, string]> = [
    ["Groceries", 600, "groceries", "#22C55E"],
    ["Dining", 350, "dining", "#F59E0B"],
    ["Transport", 220, "transport", "#3B82F6"],
    ["Housing", 1900, "housing", "#8B5CF6"],
    ["Utilities", 250, "utilities", "#EAB308"],
    ["Entertainment", 180, "entertainment", "#EC4899"],
    ["Shopping", 300, "shopping", "#F97316"],
    ["Subscriptions", 80, "subscriptions", "#40D6C9"],
  ];
  return defs.map(([category, limit, icon, color]) => ({
    id: uid("bud"),
    user_id: userId,
    category,
    limit,
    month,
    icon,
    color,
    alerts_enabled: true,
  }));
}

export function seedSubscriptions(userId: string): Subscription[] {
  const today = new Date();
  const future = (days: number) => isoFromDate(new Date(today.getTime() + days * 86400000));

  const make = (
    name: string,
    amount: number,
    cycle: Subscription["billing_cycle"],
    nextDays: number,
    category: string,
    status: Subscription["status"],
    usage: number,
    priceBumped = false,
  ): Subscription => {
    const base = priceBumped ? Math.round((amount - 2) * 100) / 100 : amount;
    return {
      id: uid("sub"),
      user_id: userId,
      name,
      amount,
      basePrice: base,
      currentPrice: amount,
      last_known_price: base,
      lastPriceChangeAt: priceBumped ? future(-40) : undefined,
      priceHistory: priceBumped
        ? [
            { date: future(-200), price: base },
            { date: future(-40), price: amount },
          ]
        : [{ date: future(-200), price: amount }],
      currency: "USD",
      billing_cycle: cycle,
      next_billing_date: future(nextDays),
      category,
      status,
      usage_rating: usage,
      reminder_days: 3,
    };
  };

  return [
    make("Netflix", 15.49, "monthly", 4, "Entertainment", "active", 4, true),
    make("Spotify Premium", 11.99, "monthly", 6, "Entertainment", "active", 5),
    make("Adobe Creative Cloud", 22.99, "monthly", 2, "Software", "active", 3, true),
    make("iCloud+ Storage", 2.99, "monthly", 11, "Software", "active", 5),
    make("Notion Plus", 96, "yearly", 48, "Software", "active", 4),
    make("Disney+", 13.99, "monthly", 9, "Entertainment", "paused", 2),
    make("NYT Digital", 17, "monthly", 14, "News", "active", 3),
    make("Amazon Prime", 139, "yearly", 120, "Shopping", "active", 4),
  ];
}
