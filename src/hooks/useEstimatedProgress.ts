"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ESTIMATED_PROGRESS, PERCENTAGE_THRESHOLDS } from "@constants";

import type {
  UseEstimatedProgressOptions,
  UseEstimatedProgressResult,
} from "./useEstimatedProgress.types";

export type {
  EstimatedProgressStage,
  UseEstimatedProgressOptions,
  UseEstimatedProgressResult,
} from "./useEstimatedProgress.types";

/**
 * Client-side staged progress for long ops that only expose a boolean busy flag.
 * The sync/import APIs do not stream real % — this eases toward `capPercent` while
 * `active`, then jumps to 100% when the request finishes. Prefer server stages if
 * those are added later.
 */
export function useEstimatedProgress(
  active: boolean,
  options: UseEstimatedProgressOptions,
): UseEstimatedProgressResult {
  const {
    stages,
    tickMs = ESTIMATED_PROGRESS.TICK_MS,
    capPercent = ESTIMATED_PROGRESS.CAP_PERCENT,
    completeHoldMs = ESTIMATED_PROGRESS.COMPLETE_HOLD_MS,
  } = options;

  const [percent, setPercent] = useState(PERCENTAGE_THRESHOLDS.MIN);
  const [visible, setVisible] = useState(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (active) {
      wasActiveRef.current = true;
      setVisible(true);
      setPercent(ESTIMATED_PROGRESS.START_PERCENT);

      const id = window.setInterval(() => {
        setPercent((prev) => {
          if (prev >= capPercent) return capPercent;
          const remaining = capPercent - prev;
          const step = Math.max(
            ESTIMATED_PROGRESS.MIN_STEP,
            Math.ceil(remaining * ESTIMATED_PROGRESS.EASE_FACTOR),
          );
          return Math.min(capPercent, prev + step);
        });
      }, tickMs);

      return () => window.clearInterval(id);
    }

    if (!wasActiveRef.current) {
      return;
    }

    setPercent(PERCENTAGE_THRESHOLDS.MAX);
    setVisible(true);

    const holdId = window.setTimeout(() => {
      setVisible(false);
      setPercent(PERCENTAGE_THRESHOLDS.MIN);
      wasActiveRef.current = false;
    }, completeHoldMs);

    return () => window.clearTimeout(holdId);
  }, [active, capPercent, completeHoldMs, tickMs]);

  const label = useMemo(() => {
    if (!stages.length) return "";
    const match = stages.find((stage) => percent <= stage.until);
    return match?.label ?? stages[stages.length - 1]!.label;
  }, [percent, stages]);

  return { percent, label, visible };
}
