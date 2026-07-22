"use client";

import { cn } from "@utils/cn";

export interface FilterPillOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Underline style used on Analytics income category filters. */
  variant?: "pill" | "underline";
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  className,
  variant = "pill",
}: FilterPillsProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        if (variant === "underline") {
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "shrink-0 px-1 pb-2 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-primary-main text-primary-main font-semibold"
                  : "border-b-2 border-transparent text-on-surface-variant",
              )}
            >
              {opt.label}
            </button>
          );
        }
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-light text-white"
                : "bg-surface-low text-on-surface-variant hover:bg-surface-container",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
