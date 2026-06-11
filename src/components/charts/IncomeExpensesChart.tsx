import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlySeriesPoint } from "../../lib/finance";
import { formatCurrency, formatCurrencyShort } from "../../lib/utils";

export function IncomeExpensesChart({
  data,
  height = 280,
}: {
  data: MonthlySeriesPoint[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} barGap={6} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="cf-income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="cf-expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.92} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="var(--chart-grid)"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--chart-axis)", fontSize: 12, fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            tickFormatter={(v) => formatCurrencyShort(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--chart-grid)" }}
            formatter={(value: number, name) => [
              formatCurrency(value),
              name === "income" ? "Income" : "Expenses",
            ]}
          />
          <Bar dataKey="income" fill="url(#cf-income)" radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expenses" fill="url(#cf-expense)" radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
