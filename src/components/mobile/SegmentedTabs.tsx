"use client";

import { cn } from "@utils/cn";

export interface SegmentedTabOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedTabsProps<T extends string = string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto", className)}
      role="tablist"
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
              "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-deep text-white shadow-sm"
                : "bg-transparent text-gray-500 hover:text-brand-deep",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
