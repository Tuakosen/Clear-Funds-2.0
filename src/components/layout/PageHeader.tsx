import type { ReactNode } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-content sm:text-[28px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-content-secondary">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle className="hidden lg:inline-flex" />
      </div>
    </header>
  );
}
