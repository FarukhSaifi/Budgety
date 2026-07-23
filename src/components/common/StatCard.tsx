import type { ReactNode } from "react";

import { cn } from "@utils/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "income" | "expense" | "brand";
  className?: string;
}

const TONE_ACCENT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-surface-high text-on-surface-variant",
  income: "bg-green-100 text-income",
  expense: "bg-red-100 text-expense",
  brand: "bg-primary-soft text-primary-main",
};

export function StatCard({ label, value, icon, hint, tone = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-outline-variant/60 bg-card p-4 shadow-card md:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              TONE_ACCENT[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-deep">{value}</p>
      {hint && <div className="mt-1 text-xs text-on-surface-variant">{hint}</div>}
    </div>
  );
}
