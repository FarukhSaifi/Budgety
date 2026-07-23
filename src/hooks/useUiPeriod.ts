"use client";

import { useCallback, useMemo } from "react";

import { MONTHS, UI_TEXT, VIEW_PERIOD_LABELS, VIEW_PERIODS } from "@constants";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setViewPeriod } from "@store/slices/uiSlice";
import { getPreviousPeriod, shiftMonthYear } from "@utils/periodFilter";

import type { ViewPeriod } from "@/types";

/**
 * Shared UI period state + navigation helpers (month/year chevrons, previous period).
 */
export function useUiPeriod() {
  const dispatch = useAppDispatch();
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((s) => s.ui);

  const setPeriod = useCallback(
    (next: { viewPeriod: ViewPeriod; selectedMonth?: number; selectedYear?: number }) => {
      dispatch(setViewPeriod(next));
    },
    [dispatch],
  );

  /** Shift by one month; forces monthly view (legacy month chevrons). */
  const shiftMonth = useCallback(
    (delta: number) => {
      const next = shiftMonthYear(selectedMonth, selectedYear, delta);
      dispatch(
        setViewPeriod({
          viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
          selectedMonth: next.month,
          selectedYear: next.year,
        }),
      );
    },
    [dispatch, selectedMonth, selectedYear],
  );

  /**
   * Shift the active period without changing mode:
   * - monthly → ±1 month
   * - yearly → ±1 year
   * - all → no-op
   */
  const shiftPeriod = useCallback(
    (delta: number) => {
      if (viewPeriod === VIEW_PERIODS.ALL) return;

      if (viewPeriod === VIEW_PERIODS.YEARLY) {
        dispatch(
          setViewPeriod({
            viewPeriod: VIEW_PERIODS.YEARLY as ViewPeriod,
            selectedMonth,
            selectedYear: selectedYear + delta,
          }),
        );
        return;
      }

      const next = shiftMonthYear(selectedMonth, selectedYear, delta);
      dispatch(
        setViewPeriod({
          viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
          selectedMonth: next.month,
          selectedYear: next.year,
        }),
      );
    },
    [dispatch, viewPeriod, selectedMonth, selectedYear],
  );

  const canShiftPeriod = viewPeriod !== VIEW_PERIODS.ALL;

  const previousPeriod = useMemo(
    () => getPreviousPeriod(viewPeriod, selectedMonth, selectedYear),
    [viewPeriod, selectedMonth, selectedYear],
  );

  /** Center label for period nav — respects monthly / yearly / all. */
  const periodLabel = useMemo(() => {
    if (viewPeriod === VIEW_PERIODS.ALL) {
      return VIEW_PERIOD_LABELS[VIEW_PERIODS.ALL] ?? UI_TEXT.ALL_TIME;
    }
    if (viewPeriod === VIEW_PERIODS.YEARLY) {
      return String(selectedYear);
    }
    const monthName = MONTHS[selectedMonth - 1] ?? String(selectedMonth);
    return `${monthName.slice(0, 3)} ${selectedYear}`;
  }, [viewPeriod, selectedMonth, selectedYear]);

  /** @deprecated Prefer `periodLabel` — kept for callers that expected a long date string. */
  const dateNavLabel = periodLabel;

  const shiftPrevLabel = viewPeriod === VIEW_PERIODS.YEARLY ? UI_TEXT.PREVIOUS_YEAR : UI_TEXT.PREVIOUS_MONTH;
  const shiftNextLabel = viewPeriod === VIEW_PERIODS.YEARLY ? UI_TEXT.NEXT_YEAR : UI_TEXT.NEXT_MONTH;

  return {
    viewPeriod,
    selectedMonth,
    selectedYear,
    setPeriod,
    shiftMonth,
    shiftPeriod,
    canShiftPeriod,
    previousPeriod,
    dateNavLabel,
    periodLabel,
    shiftPrevLabel,
    shiftNextLabel,
  };
}
