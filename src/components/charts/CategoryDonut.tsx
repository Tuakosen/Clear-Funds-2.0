import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import type { CategorySlice } from "../../lib/finance";
import { cn, formatCurrency } from "../../lib/utils";

// Active slice renders enlarged + glowing; others dim via opacity.
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g style={{ filter: `drop-shadow(0 0 10px ${fill}aa)` }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 7}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
    </g>
  );
}

export function CategoryDonut({
  data,
  height = 260,
}: {
  data: CategorySlice[];
  height?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-content-muted"
        style={{ height }}
      >
        No spending recorded this month yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row">
      <div className="relative" style={{ width: 220, height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              cornerRadius={4}
              startAngle={90}
              endAngle={-270}
              activeIndex={active ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              isAnimationActive
            >
              {data.map((slice, i) => (
                <Cell
                  key={slice.name}
                  fill={slice.color}
                  stroke="transparent"
                  style={{
                    opacity: active === null || active === i ? 1 : 0.32,
                    transition: "opacity 0.2s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-content-muted">
            {active === null ? "Total" : data[active].name}
          </span>
          <span className="text-xl font-extrabold text-content">
            {formatCurrency(active === null ? total : data[active].value)}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-1.5 self-stretch">
        {data.map((slice, i) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          const isActive = active === i;
          const dim = active !== null && !isActive;
          return (
            <li
              key={slice.name}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition",
                isActive && "bg-surface-2",
              )}
              style={{ opacity: dim ? 0.5 : 1 }}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full transition-all"
                style={{
                  background: slice.color,
                  boxShadow: isActive ? `0 0 10px ${slice.color}` : "none",
                  transform: isActive ? "scale(1.25)" : "scale(1)",
                }}
              />
              <span
                className={cn(
                  "flex-1 truncate text-sm transition-all",
                  isActive
                    ? "font-bold text-content"
                    : "font-medium text-content-secondary",
                )}
              >
                {slice.name}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums transition-all",
                  isActive ? "font-bold text-content" : "text-content-muted",
                )}
              >
                {formatCurrency(slice.value)}
              </span>
              <span className="w-9 text-right text-xs tabular-nums text-content-muted">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
