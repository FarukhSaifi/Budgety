"use client";

import { CURRENCY_SYMBOL, STITCH_CHART_COLORS, UI_TEXT } from "@constants";

import { CloseIcon } from "@components/icons";

import { cn } from "@utils/cn";
import { getCategoryChartColor, hexToRgba } from "@utils/colorUtils";

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
  /**
   * Visual wrapper style.
   * - "card": stitched card container (rounded/bg/padding/shadow)
   * - "plain": blend into parent (no border/bg/padding/shadow)
   */
  variant?: "card" | "plain";
  className?: string;
  maxLegend?: number;
  /** Currently selected category filter (empty = all). */
  selectedCategory?: string;
  /** Click a segment or legend chip to filter; click again to clear. */
  onSelectCategory?: (category: string | null) => void;
}

function resolveColor(name: string, index: number, explicit?: string): string {
  return explicit || getCategoryChartColor(name, index) || STITCH_CHART_COLORS[index % STITCH_CHART_COLORS.length];
}

export function SpendSummaryBar({
  total,
  segments,
  formatCurrency,
  title = UI_TEXT.TOTAL_SPEND,
  variant = "card",
  className,
  maxLegend = 6,
  selectedCategory = "",
  onSelectCategory,
}: SpendSummaryBarProps) {
  // Only render meaningful spend slices (prevents zero/negative entries collapsing to 0px).
  const colored = segments
    .map((s, i) => ({
    ...s,
    color: resolveColor(s.name, i, s.color),
    }))
    .filter((s) => Number.isFinite(s.value) && s.value > 0);

  const sum = colored.reduce((acc, s) => acc + s.value, 0);
  const interactive = typeof onSelectCategory === "function";
  const active = String(selectedCategory || "")
    .trim()
    .toLowerCase();

  const toggle = (name: string) => {
    if (!interactive) return;
    const next = name.toLowerCase() === active ? null : name;
    onSelectCategory(next);
  };

  const hasSegments = sum > 0;
  const wrapperClass =
    variant === "plain"
      ? cn("rounded-none border-0 bg-transparent p-0 shadow-none", className)
      : cn("rounded-card bg-card p-4 shadow-card", className);

  return (
    <div className={wrapperClass}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-on-surface-variant">{title}</h3>
          {active ? (
            <button
              type="button"
              onClick={() => onSelectCategory?.(null)}
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-main transition hover:opacity-90"
            >
              {UI_TEXT.FILTER_BY_CATEGORY} {selectedCategory}
              <CloseIcon className="h-3 w-3" aria-hidden />
              <span className="sr-only">{UI_TEXT.CLEAR_FILTER}</span>
            </button>
          ) : null}
        </div>
        <p className="shrink-0 text-xl font-bold tabular-nums text-brand-deep">
          {CURRENCY_SYMBOL}
          {formatCurrency(total)}
        </p>
      </div>

      <div
        className="flex h-4 overflow-hidden rounded-full bg-surface-container ring-1 ring-outline-variant/40"
        role={interactive ? "listbox" : undefined}
        aria-label={title}
      >
        {hasSegments ? (
          colored.map((s) => {
          const isActive = active === s.name.toLowerCase();
          const widthPct = sum > 0 ? Math.max((s.value / sum) * 100, 2) : 0;
          const SegmentTag = interactive ? "button" : "div";
          return (
            <SegmentTag
              key={s.name}
              type={interactive ? "button" : undefined}
              role={interactive ? "option" : undefined}
              aria-selected={interactive ? isActive : undefined}
              title={`${s.name}: ${CURRENCY_SYMBOL}${formatCurrency(s.value)}`}
              onClick={interactive ? () => toggle(s.name) : undefined}
              className={cn(
                "h-full min-w-1 first:rounded-l-full last:rounded-r-full transition-[filter,opacity,transform]",
                interactive &&
                  "cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main/40",
                isActive && "z-1 brightness-110 ring-2 ring-inset ring-white/50",
                active && !isActive && "opacity-40",
              )}
              style={{
                width: `${widthPct}%`,
                backgroundColor: s.color,
              }}
            />
          );
          })
        ) : (
          // Empty state: keep the bar footprint for layout stability.
          <div className="h-full w-full bg-surface-low/70" aria-hidden />
        )}
      </div>

      {hasSegments ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {colored.slice(0, maxLegend).map((s) => {
            const isActive = active === s.name.toLowerCase();
            const chipClass = cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
              interactive && "cursor-pointer hover:brightness-105",
              isActive
                ? "border-transparent shadow-sm ring-2 ring-primary-main/30"
                : "border-outline-variant/50",
              active && !isActive && "opacity-50",
            );
            const chipStyle = {
              backgroundColor: hexToRgba(s.color, isActive ? 0.28 : 0.14),
              color: s.color,
              borderColor: isActive ? s.color : undefined,
            } as const;
            const chipInner = (
              <>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
              </>
            );
            if (interactive) {
              return (
                <li key={s.name} className="list-none">
                  <button
                    type="button"
                    onClick={() => toggle(s.name)}
                    aria-pressed={isActive}
                    className={chipClass}
                    style={chipStyle}
                    title={`${s.name}: ${CURRENCY_SYMBOL}${formatCurrency(s.value)}`}
                  >
                    {chipInner}
                  </button>
                </li>
              );
            }
            return (
              <li
                key={s.name}
                className={chipClass}
                style={chipStyle}
                title={`${s.name}: ${CURRENCY_SYMBOL}${formatCurrency(s.value)}`}
              >
                {chipInner}
              </li>
            );
          })}
          {colored.length > maxLegend ? (
            <li className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-low px-2.5 py-1 text-xs text-on-surface-variant">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-outline" />
              {UI_TEXT.OTHERS}
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-on-surface-variant">{UI_TEXT.NO_SPENDING_DATA}</p>
      )}
    </div>
  );
}
