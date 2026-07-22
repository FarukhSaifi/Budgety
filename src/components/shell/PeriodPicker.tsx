"use client";

import { MONTHS, UI_TEXT, VIEW_PERIOD_LABELS, VIEW_PERIODS } from "@constants";
import { Select } from "@common";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setViewPeriod } from "@store/slices/uiSlice";
import type { ViewPeriod } from "@/types";
import { ExpandMoreIcon } from "@components/icons";
import { useEffect, useRef, useState } from "react";

function yearRange(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current - 5; y <= current + 1; y += 1) years.push(y);
  return years;
}

export function PeriodPicker() {
  const dispatch = useAppDispatch();
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((state) => state.ui);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const label =
    viewPeriod === VIEW_PERIODS.MONTHLY
      ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
      : viewPeriod === VIEW_PERIODS.YEARLY
        ? `${selectedYear}`
        : UI_TEXT.ALL_TIME;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-card px-3 py-1.5 text-sm font-medium text-brand-deep hover:bg-surface-low"
      >
        {label}
        <ExpandMoreIcon className="h-4 w-4 text-on-surface-variant" />
      </button>

      {open && (
        <div className="absolute left-0 z-1000 mt-2 w-64 rounded-2xl border border-outline-variant/60 bg-card p-4 shadow-elevated">
          <p className="mb-3 text-sm font-semibold text-brand-deep">{UI_TEXT.SELECT_PERIOD}</p>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-on-surface-variant">
              {UI_TEXT.VIEW_PERIOD_LABEL_SHORT}
              <Select
                className="mt-1"
                value={viewPeriod}
                onChange={(e) =>
                  dispatch(setViewPeriod({ viewPeriod: e.target.value as ViewPeriod }))
                }
              >
                <option value={VIEW_PERIODS.MONTHLY}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.MONTHLY]}</option>
                <option value={VIEW_PERIODS.YEARLY}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.YEARLY]}</option>
                <option value={VIEW_PERIODS.ALL}>{VIEW_PERIOD_LABELS[VIEW_PERIODS.ALL]}</option>
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
          </div>
        </div>
      )}
    </div>
  );
}
