"use client";

import { UI_TEXT } from "@constants";
import { DownloadIcon, MoreVertIcon, RefreshIcon } from "@components/icons";
import { cn } from "@utils/cn";
import type { ReactNode } from "react";

export interface DashboardWidgetProps {
  title: string;
  children: ReactNode;
  onRefresh?: () => void;
  onExport?: () => void;
  action?: ReactNode;
  className?: string;
}

export function DashboardWidget({
  title,
  children,
  onRefresh,
  onExport,
  action,
  className,
}: DashboardWidgetProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-gray-100/80 bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 pb-3 pt-5 md:px-6">
        <h3 className="text-base font-bold text-brand-deep">{title}</h3>
        <div className="flex items-center gap-0.5 text-gray-400">
          {action}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surface-low hover:text-brand-deep"
              aria-label={UI_TEXT.REFRESH}
              title={UI_TEXT.REFRESH}
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surface-low hover:text-brand-deep"
              aria-label={UI_TEXT.EXPORT_DATA}
              title={UI_TEXT.EXPORT_DATA}
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          )}
          {(onRefresh || onExport) && (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              aria-hidden
            >
              <MoreVertIcon className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 px-3 pb-5 md:px-4 md:pb-6">{children}</div>
    </div>
  );
}
