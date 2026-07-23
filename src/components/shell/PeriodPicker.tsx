"use client";

import { useEffect, useRef, useState } from "react";

import { MONTHS, UI_TEXT, VIEW_PERIOD_LABELS, VIEW_PERIODS } from "@constants";

import { Select } from "@common";

import { ExpandMoreIcon } from "@components/icons";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setViewPeriod } from "@store/slices/uiSlice";
import { cn } from "@utils/cn";
import { toStorageDate, todayStorage } from "@utils/dateUtils";

import type { ViewPeriod } from "@/types";

function yearRange(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current - 5; y <= current + 1; y += 1) years.push(y);
  return years;
}

export type PeriodPickerProps = {
  /** `chip` matches Analytics / section header pill triggers. */
  variant?: "default" | "chip";
  /** Popover alignment relative to the trigger. */
  align?: "left" | "right";
  /** Abbreviated month label (e.g. "Jul 2026"). Defaults true for `chip`. */
  compact?: boolean;
  /** Show Custom Range option + date inputs. */
  allowRange?: boolean;
  className?: string;
};

export function PeriodPicker({
  variant = "default",
  align = "left",
  compact,
  allowRange = false,
  className,
}: PeriodPickerProps) {
  const dispatch = useAppDispatch();
  const { viewPeriod, selectedMonth, selectedYear, rangeStart, rangeEnd } = useAppSelector((state) => state.ui);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const useCompact = compact ?? variant === "chip";

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const monthName = MONTHS[selectedMonth - 1] ?? "";
  const label =
    viewPeriod === VIEW_PERIODS.MONTHLY
      ? `${useCompact ? monthName.slice(0, 3) : monthName} ${selectedYear}`
      : viewPeriod === VIEW_PERIODS.YEARLY
        ? `${selectedYear}`
        : viewPeriod === VIEW_PERIODS.RANGE
          ? `${toStorageDate(rangeStart) || "…"} → ${toStorageDate(rangeEnd) || "…"}`
          : UI_TEXT.ALL_TIME;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={UI_TEXT.SELECT_PERIOD}
        className={cn(
          "inline-flex max-w-full items-center font-medium text-brand-deep transition-colors hover:bg-surface-low",
          variant === "chip"
            ? "gap-1 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs text-on-surface-variant"
            : "gap-1.5 rounded-xl border border-outline-variant/60 bg-card px-3 py-1.5 text-sm",
        )}
      >
        <span className="truncate">{label}</span>
        <ExpandMoreIcon
          className={cn(
            "shrink-0 text-on-surface-variant transition-transform",
            variant === "chip" ? "h-3.5 w-3.5" : "h-4 w-4",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={UI_TEXT.SELECT_PERIOD}
          className={cn(
            "absolute z-1000 mt-2 w-72 rounded-2xl border border-outline-variant/60 bg-card p-4 shadow-elevated",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <p className="mb-3 text-sm font-semibold text-brand-deep">{UI_TEXT.SELECT_PERIOD}</p>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-on-surface-variant">
              {UI_TEXT.VIEW_PERIOD_LABEL_SHORT}
              <Select
                className="mt-1"
                value={viewPeriod}
                onChange={(e) => {
                  const next = e.target.value as ViewPeriod;
                  if (next === VIEW_PERIODS.RANGE) {
                    const start = toStorageDate(rangeStart) || todayStorage();
                    const end = toStorageDate(rangeEnd) || todayStorage();
                    dispatch(
                      setViewPeriod({
                        viewPeriod: next,
                        rangeStart: start,
                        rangeEnd: end < start ? start : end,
                      }),
                    );
                    return;
                  }
                  dispatch(setViewPeriod({ viewPeriod: next }));
                }}
              >
                <option value={VIEW_PERIODS.MONTHLY}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.MONTHLY]}</option>
                <option value={VIEW_PERIODS.YEARLY}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.YEARLY]}</option>
                <option value={VIEW_PERIODS.ALL}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.ALL]}</option>
                {allowRange ? (
                  <option value={VIEW_PERIODS.RANGE}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.RANGE]}</option>
                ) : null}
              </Select>
            </label>

            {viewPeriod === VIEW_PERIODS.MONTHLY && (
              <label className="block text-xs font-medium text-on-surface-variant">
                {UI_TEXT.MONTH_LABEL}
                <Select
                  className="mt-1"
                  value={selectedMonth}
                  onChange={(e) =>
                    dispatch(
                      setViewPeriod({
                        viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
                        selectedMonth: Number(e.target.value),
                        selectedYear,
                      }),
                    )
                  }
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </Select>
              </label>
            )}

            {(viewPeriod === VIEW_PERIODS.MONTHLY || viewPeriod === VIEW_PERIODS.YEARLY) && (
              <label className="block text-xs font-medium text-on-surface-variant">
                {UI_TEXT.YEAR_LABEL}
                <Select
                  className="mt-1"
                  value={selectedYear}
                  onChange={(e) =>
                    dispatch(
                      setViewPeriod({
                        viewPeriod,
                        selectedMonth,
                        selectedYear: Number(e.target.value),
                      }),
                    )
                  }
                >
                  {yearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </label>
            )}

            {allowRange && viewPeriod === VIEW_PERIODS.RANGE && (
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-on-surface-variant">
                  {UI_TEXT.RANGE_START_LABEL}
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-card px-2 py-2 text-sm text-brand-deep"
                    value={toStorageDate(rangeStart)}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      const end = toStorageDate(rangeEnd) || nextStart;
                      dispatch(
                        setViewPeriod({
                          viewPeriod: VIEW_PERIODS.RANGE as ViewPeriod,
                          rangeStart: nextStart,
                          rangeEnd: end < nextStart ? nextStart : end,
                        }),
                      );
                    }}
                  />
                </label>
                <label className="block text-xs font-medium text-on-surface-variant">
                  {UI_TEXT.RANGE_END_LABEL}
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-card px-2 py-2 text-sm text-brand-deep"
                    value={toStorageDate(rangeEnd)}
                    min={toStorageDate(rangeStart) || undefined}
                    onChange={(e) => {
                      const nextEnd = e.target.value;
                      const start = toStorageDate(rangeStart) || nextEnd;
                      dispatch(
                        setViewPeriod({
                          viewPeriod: VIEW_PERIODS.RANGE as ViewPeriod,
                          rangeStart: nextEnd < start ? nextEnd : start,
                          rangeEnd: nextEnd,
                        }),
                      );
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
