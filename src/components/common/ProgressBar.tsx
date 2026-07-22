import { cn } from "@utils/cn";
import { PERCENTAGE_THRESHOLDS } from "@constants";

export interface ProgressBarProps {
  /** 0–100 (values above 100 are clamped for the bar width). */
  value: number;
  className?: string;
  /** Override the fill color; otherwise it is derived from thresholds. */
  colorClassName?: string;
  /** Hex/CSS color for the fill (e.g. category chart color). Wins over colorClassName. */
  fillColor?: string;
  trackClassName?: string;
}

export function ProgressBar({
  value,
  className,
  colorClassName,
  fillColor,
  trackClassName,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, PERCENTAGE_THRESHOLDS.MAX));
  const derived =
    value >= PERCENTAGE_THRESHOLDS.MAX
      ? "bg-expense"
      : value >= PERCENTAGE_THRESHOLDS.WARNING
        ? "bg-amber-500"
        : "bg-income";

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-100", trackClassName, className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          fillColor ? undefined : (colorClassName ?? derived),
        )}
        style={{
          width: `${clamped}%`,
          ...(fillColor ? { backgroundColor: fillColor } : null),
        }}
      />
    </div>
  );
}
