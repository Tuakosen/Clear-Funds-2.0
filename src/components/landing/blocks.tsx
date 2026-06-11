import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="cf-chip bg-brand/10 text-brand">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-content sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-content-secondary">{subtitle}</p>
      )}
    </div>
  );
}

// Alternating image/text showcase row used on landing + feature pages.
export function ShowcaseRow({
  icon: Icon,
  eyebrow,
  title,
  description,
  bullets,
  visual,
  flip = false,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <div className={cn(flip && "lg:order-2")}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Icon size={24} />
        </span>
        {eyebrow && (
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-brand">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-content sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 text-lg text-content-secondary">{description}</p>
        {bullets && (
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-content-secondary">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-accent/20 text-teal-accent">
                  <Check size={13} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={cn(flip && "lg:order-1")}>{visual}</div>
    </div>
  );
}

// Stylized in-product mock used as ClearFunds "screenshots" (never Monarch).
export function MockFrame({ children }: { children: ReactNode }) {
  return (
    <div className="cf-card overflow-hidden p-2">
      <div className="flex items-center gap-1.5 px-2 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-expense/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-income/60" />
      </div>
      <div className="rounded-xl bg-surface-2 p-4">{children}</div>
    </div>
  );
}
