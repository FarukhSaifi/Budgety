import { cn } from "@utils/cn";
import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "income" | "expense" | "brand";
  className?: string;
}

const TONE_ACCENT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-gray-100 text-gray-600",
  income: "bg-green-100 text-income",
  expense: "bg-red-100 text-expense",
  brand: "bg-primary-soft text-primary-main",
};

export function StatCard({ label, value, icon, hint, tone = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-gray-100 bg-white p-4 shadow-card md:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
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
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
