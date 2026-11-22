"use client";

import { PERCENTAGE_THRESHOLDS } from "@constants";

import { cn } from "@utils/cn";

import type { ProgressPercentProps } from "./ProgressPercent.types";

/**
 * Percentage progress: fillable bar + visible numeric % (1–100).
 * Pair with `useEstimatedProgress` when the server only exposes a busy flag.
 */
export function ProgressPercent({
  value,
  label,
  className,
  ariaLabel,
  trackClassName,
  fillClassName,
}: ProgressPercentProps) {
  const clamped = Math.round(
    Math.max(PERCENTAGE_THRESHOLDS.MIN, Math.min(value, PERCENTAGE_THRESHOLDS.MAX)),
  );
  const accessibleName = ariaLabel ?? label;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        {label ? (
          <p className="min-w-0 truncate text-xs font-medium text-on-surface-variant">{label}</p>
        ) : (
          <span className="sr-only">{accessibleName}</span>
        )}
        <span className="shrink-0 tabular-nums text-xs font-semibold text-brand-deep" aria-hidden="true">
          {clamped}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={PERCENTAGE_THRESHOLDS.MIN}
        aria-valuemax={PERCENTAGE_THRESHOLDS.MAX}
        aria-valuenow={clamped}
        aria-label={accessibleName}
        className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-low", trackClassName)}
      >
        <div
          className={cn("motion-progress-fill h-full rounded-full bg-primary-main", fillClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
