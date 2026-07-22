"use client";

import { UI_TEXT } from "@constants";
import { cn } from "@utils/cn";
import type { BillTab } from "./billHelpers";

export interface BillsTabsProps {
  value: BillTab;
  onChange: (tab: BillTab) => void;
  /** Show red notification dot on Upcoming when there are overdue bills. */
  upcomingHasAlert?: boolean;
  className?: string;
}

const TABS: { id: BillTab; label: string }[] = [
  { id: "upcoming", label: UI_TEXT.UPCOMING },
  { id: "paid", label: UI_TEXT.PAID },
  { id: "all", label: UI_TEXT.ALL },
];

export function BillsTabs({
  value,
  onChange,
  upcomingHasAlert = false,
  className,
}: BillsTabsProps) {
  return (
    <div
      className={cn(
        "flex border-b border-surface-high bg-surface/90 backdrop-blur-md",
        className,
      )}
      role="tablist"
      aria-label={UI_TEXT.BILLS}
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-1 py-3.5 text-center text-sm transition-colors md:flex-none md:px-4",
              active
                ? "border-b-2 border-primary-main font-semibold text-primary-main"
                : "font-medium text-gray-500 hover:text-brand-deep",
            )}
          >
            {tab.label}
            {tab.id === "upcoming" && upcomingHasAlert && (
              <span
                className="absolute right-1/4 top-2.5 h-2 w-2 rounded-full bg-expense md:right-1 md:top-2"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
