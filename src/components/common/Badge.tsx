import type { ReactNode } from "react";

import { cn } from "@utils/cn";

export type BadgeTone = "neutral" | "success" | "danger" | "warning" | "info";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-high text-on-surface-variant",
  success: "bg-income-soft text-income",
  danger: "bg-expense-soft text-expense",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-primary-soft text-primary-main",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
