import { VIEW_PERIODS } from "@constants";

import type { AppDispatch } from "@store/index";
import { setSearchQuery, setSelectedCategory, setViewPeriod } from "@store/slices/uiSlice";
import { getMonthYear } from "@utils/dateUtils";

import type { Transaction, ViewPeriod } from "@/types";

/**
 * After import/auto-sync, jump the period filter to the imported month(s)
 * so Oct/Nov statements are immediately visible in monthly views.
 */
export function focusUiOnImported(dispatch: AppDispatch, saved: Transaction[]): void {
  const buckets = new Map<string, { month: number; year: number }>();
  saved.forEach((tx) => {
    const my = getMonthYear(tx.date);
    if (!my) return;
    buckets.set(`${my.year}-${my.month}`, my);
  });

  dispatch(setSelectedCategory(""));
  dispatch(setSearchQuery(""));

  if (buckets.size === 1) {
    const only = [...buckets.values()][0];
    dispatch(
      setViewPeriod({
        viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
        selectedMonth: only.month,
        selectedYear: only.year,
      }),
    );
    return;
  }

  if (buckets.size > 1) {
    dispatch(setViewPeriod({ viewPeriod: VIEW_PERIODS.ALL as ViewPeriod }));
  }
}
