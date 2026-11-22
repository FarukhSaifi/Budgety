export interface ProgressPercentProps {
  /** 0–100 (clamped for display and ARIA). */
  value: number;
  /** Optional status label shown beside the percentage. */
  label?: string;
  className?: string;
  /** Accessible name when `label` is empty or not descriptive enough. */
  ariaLabel?: string;
  trackClassName?: string;
  fillClassName?: string;
}
