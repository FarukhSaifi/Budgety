"use client";

import { CHART_CONFIG } from "@constants";
import { cn } from "@utils/cn";
import type { ReactElement, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export interface ChartCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  height?: number;
  /** A single Recharts chart element (e.g. <PieChart>...). */
  children: ReactElement;
  className?: string;
  empty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  height = CHART_CONFIG.DEFAULT_CHART_HEIGHT,
  children,
  className,
  empty = false,
  emptyMessage = "No data available",
}: ChartCardProps) {
  return (
    <div className={cn("rounded-card border border-outline-variant/60 bg-card p-4 shadow-card md:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-semibold text-brand-deep">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {empty ? (
        <div
          className="flex items-center justify-center text-sm text-on-surface-variant"
          style={{ height }}
        >
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
