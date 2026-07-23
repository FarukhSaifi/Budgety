import { useMemo } from "react";

import { VIEW_PERIODS } from "@constants";

import {
  aggregateTransactions,
  computePeriodAggregates,
  type MonthlyBreakdownEntry,
  type PeriodAggregates,
} from "@utils/periodFilter";
import { buildSearchCorpus, filterTransactionsBySearchCorpus } from "@utils/searchUtils";

import type { Transaction, ViewPeriod } from "@/types";

export type { MonthlyBreakdownEntry };

export type BudgetCalculations = PeriodAggregates;

/**
 * Core aggregation used by the dashboard, reports and transaction views.
 * Pure + memoized; filters by period and (optionally) a search query.
 *
 * When `searchQuery` is non-empty, searches **all loaded transactions**
 * (period filter is ignored) so results are not month-scoped.
 */
export const useBudgetCalculations = (
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
  searchQuery = "",
  rangeStart?: string | null,
  rangeEnd?: string | null,
): BudgetCalculations => {
  const searchCorpus = useMemo(() => buildSearchCorpus(transactions), [transactions]);

  return useMemo(() => {
    const periodOptions = { rangeStart, rangeEnd };
    const trimmed = searchQuery.trim();

    if (trimmed) {
      const filteredTransactions = filterTransactionsBySearchCorpus(transactions, searchCorpus, trimmed);
      return {
        ...aggregateTransactions(filteredTransactions, { includeMonthlyBreakdown: true }),
        filteredTransactions,
      };
    }

    return computePeriodAggregates(transactions, viewPeriod, selectedMonth, selectedYear, periodOptions);
  }, [transactions, searchCorpus, viewPeriod, selectedMonth, selectedYear, searchQuery, rangeStart, rangeEnd]);
};

/** Whether the active period spans more than one calendar month (calendar needs local month nav). */
export function periodNeedsCalendarMonthNav(viewPeriod: ViewPeriod): boolean {
  return (
    viewPeriod === VIEW_PERIODS.YEARLY ||
    viewPeriod === VIEW_PERIODS.ALL ||
    viewPeriod === VIEW_PERIODS.RANGE
  );
}
