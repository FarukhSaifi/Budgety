"use client";

import { cn } from "@utils/cn";

export interface SegmentedPillOption<T extends string = string> {
  value: T;
  label: string;
  /** Semantic thumb tint when this option is active. */
  tone?: "brand" | "expense" | "income";
}

export interface SegmentedPillProps<T extends string = string> {
  options: SegmentedPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

const ACTIVE_TONE: Record<NonNullable<SegmentedPillOption["tone"]>, string> = {
  brand: "bg-primary-soft text-primary-main shadow-sm ring-1 ring-primary-main/25",
  expense: "bg-expense-soft text-expense shadow-sm ring-1 ring-expense/25",
  income: "bg-income-soft text-income shadow-sm ring-1 ring-income/25",
};

/**
 * Compact pill segmented control (radiogroup). Track is rounded-full;
 * the active option renders as an elevated thumb.
 */
export function SegmentedPill<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedPillProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1 rounded-full bg-surface-low p-1 ring-1 ring-outline-variant/60",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const tone = opt.tone ?? "brand";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-w-0 flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-1",
              active
                ? ACTIVE_TONE[tone]
                : "text-on-surface-variant hover:text-brand-deep",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
