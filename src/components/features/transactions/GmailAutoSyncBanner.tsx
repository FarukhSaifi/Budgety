"use client";

import { GMAIL_SYNC_PROGRESS_STAGES, GMAIL_UI_TEXT } from "@constants";

import { ProgressPercent } from "@components/common/ProgressPercent";
import { CloudUploadIcon } from "@components/icons";

import { useEstimatedProgress } from "@hooks/useEstimatedProgress";

import type { GmailAutoSyncBannerProps } from "./GmailAutoSyncBanner.types";

/**
 * Compact in-app banner while background Gmail auto-sync is running.
 * Progress is client-estimated (sync API has no streaming %).
 */
export function GmailAutoSyncBanner({ active }: GmailAutoSyncBannerProps) {
  const progress = useEstimatedProgress(active, { stages: GMAIL_SYNC_PROGRESS_STAGES });

  if (!progress.visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-6 md:left-20"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-card border border-brand-primary/15 bg-card p-3 shadow-elevated">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CloudUploadIcon className="h-3.5 w-3.5" />
          </span>
          <p className="text-xs font-semibold text-brand-deep">{GMAIL_UI_TEXT.AUTO_SYNC_RUNNING}</p>
        </div>
        <ProgressPercent
          value={progress.percent}
          label={progress.label}
          ariaLabel={GMAIL_UI_TEXT.AUTO_SYNC_PROGRESS_ARIA}
        />
      </div>
    </div>
  );
}
