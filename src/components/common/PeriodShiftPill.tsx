"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@components/icons";

import { cn } from "@utils/cn";

export interface PeriodShiftPillProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  /** When false, chevrons are omitted (e.g. all-time) but the label stays. */
  canShift?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Compact period shift control: prev / label / next in a rounded-full track
 * matching SegmentedPill language.
 */
export function PeriodShiftPill({
  label,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  canShift = true,
  size = "md",
  className,
}: PeriodShiftPillProps) {
  const compact = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-surface-low ring-1 ring-outline-variant/60",
        compact ? "gap-0.5 p-0.5" : "gap-0.5 p-1",
        className,
      )}
    >
      {canShift ? (
        <button
          type="button"
          onClick={onPrev}
          aria-label={prevLabel}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors",
            "hover:bg-primary-soft hover:text-primary-main",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-1",
            compact ? "h-6 w-6" : "h-8 w-8",
          )}
        >
          <ChevronLeftIcon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </button>
      ) : (
        <span className={cn("shrink-0", compact ? "w-6" : "w-8")} aria-hidden />
      )}

      <p
        className={cn(
          "min-w-28 flex-1 text-center font-semibold text-brand-deep",
          compact ? "px-1 text-xs" : "px-2 text-sm",
        )}
      >
        {label}
      </p>

      {canShift ? (
        <button
          type="button"
          onClick={onNext}
          aria-label={nextLabel}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors",
            "hover:bg-primary-soft hover:text-primary-main",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-1",
            compact ? "h-6 w-6" : "h-8 w-8",
          )}
        >
          <ChevronRightIcon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </button>
      ) : (
        <span className={cn("shrink-0", compact ? "w-6" : "w-8")} aria-hidden />
      )}
    </div>
  );
}
