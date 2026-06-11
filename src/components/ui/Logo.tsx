import { cn } from "../../lib/utils";

export function Logo({
  size = 32,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="cf-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#40D6C9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#cf-logo-grad)" />
        <path
          d="M8.5 20.5c2.8 0 3.8-9 7.5-9s4.7 9 7.5 9"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2.3" fill="#fff" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-content">
          Clear<span className="text-brand">Funds</span>
        </span>
      )}
    </span>
  );
}
