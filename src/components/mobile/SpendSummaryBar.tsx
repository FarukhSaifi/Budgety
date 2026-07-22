"use client";

import { CURRENCY_SYMBOL, STITCH_CHART_COLORS, UI_TEXT } from "@constants";
import { cn } from "@utils/cn";

export interface SpendSegment {
  name: string;
  value: number;
  color?: string;
}

export interface SpendSummaryBarProps {
  total: number;
  segments: SpendSegment[];
  formatCurrency: (n: number) => string;
  title?: string;
  className?: string;
  maxLegend?: number;
}

export function SpendSummaryBar({
  total,
  segments,
  formatCurrency,
  title = UI_TEXT.TOTAL_SPEND,
  className,
  maxLegend = 5,
}: SpendSummaryBarProps) {
  const colored = segments.map((s, i) => ({
    ...s,
    color: s.color ?? STITCH_CHART_COLORS[i % STITCH_CHART_COLORS.length],
  }));
  const sum = colored.reduce((acc, s) => acc + s.value, 0) || 1;

  return (
    <div className={cn("rounded-card bg-white p-4 shadow-card", className)}>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="text-xl font-bold text-brand-deep">
          {CURRENCY_SYMBOL}
          {formatCurrency(total)}
        </p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-surface-container">
        {colored.map((s) => (
          <div
            key={s.name}
            title={`${s.name}: ${CURRENCY_SYMBOL}${formatCurrency(s.value)}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(s.value / sum) * 100}%`,
              backgroundColor: s.color,
            }}
          />
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
        {colored.slice(0, maxLegend).map((s) => (
          <li key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate">{s.name}</span>
          </li>
        ))}
        {colored.length > maxLegend && (
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" />
            {UI_TEXT.OTHERS}
          </li>
        )}
      </ul>
    </div>
  );
}
