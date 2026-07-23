"use client";

import { cn } from "@utils/cn";

export interface FilterPillOption<T extends string = string> {
  value: T;
  label: string;
  /** Semantic selected tint (matches SegmentedPill tones). */
  tone?: "brand" | "expense" | "income";
}

export interface FilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
  /** Underline style used on Analytics income category filters. */
  variant?: "pill" | "underline";
}

const ACTIVE_TONE: Record<NonNullable<FilterPillOption["tone"]>, string> = {
  brand: "bg-primary-soft text-primary-main shadow-sm ring-1 ring-primary-main/25",
  expense: "bg-expense-soft text-expense shadow-sm ring-1 ring-expense/25",
  income: "bg-income-soft text-income shadow-sm ring-1 ring-income/25",
};

/**
 * Filter control. Default `pill` is a segmented track (All | Income | …)
 * matching SegmentedPill; `underline` keeps the Analytics category strip.
 */
export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
  variant = "pill",
}: FilterPillsProps<T>) {
  if (variant === "underline") {
    return (
      <div
        className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-none", className)}
        role="tablist"
        aria-label={ariaLabel}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "shrink-0 px-1 pb-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
                active
                  ? "border-b-2 border-primary-main font-semibold text-primary-main"
                  : "border-b-2 border-transparent text-on-surface-variant",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-1 rounded-full bg-surface-low p-1 ring-1 ring-outline-variant/60",
        className,
      )}
      role="radiogroup"
      aria-label={ariaLabel}
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
              "min-w-0 flex-1 rounded-full px-2 py-2.5 text-center text-sm font-semibold transition-all",
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
