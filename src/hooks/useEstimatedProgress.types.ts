export interface EstimatedProgressStage {
  /** Inclusive upper bound (0–100) for this stage’s label. */
  until: number;
  label: string;
}

export interface UseEstimatedProgressOptions {
  stages: readonly EstimatedProgressStage[];
  tickMs?: number;
  /** Soft ceiling while the operation is still running (default ~90). */
  capPercent?: number;
  /** How long to show 100% after `active` becomes false. */
  completeHoldMs?: number;
}

export interface UseEstimatedProgressResult {
  percent: number;
  label: string;
  /** True while running or briefly after complete (for UI visibility). */
  visible: boolean;
}
