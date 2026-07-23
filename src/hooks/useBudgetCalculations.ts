import { useMemo } from "react";

import { VIEW_PERIODS } from "@constants";

import {
  aggregateTransactions,
  computePeriodAggregates,
  filterTransactionsByPeriod,
  type MonthlyBreakdownEntry,
  type PeriodAggregates,
} from "@utils/periodFilter";
import { filterTransactionsBySearch } from "@utils/searchUtils";

import type { Transaction, ViewPeriod } from "@/types";

export type { MonthlyBreakdownEntry };

export type BudgetCalculations = PeriodAggregates;

/**
 * Core aggregation used by the dashboard, reports and transaction views.
 * Pure + memoized; filters by period and (optionally) a search query.
 * Prefer `selectPeriodAggregates` when search is empty to share memoized work.
 */
export const useBudgetCalculations = (
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
  searchQuery = "",
): BudgetCalculations => {
  return useMemo(() => {
    if (!searchQuery) {
      return computePeriodAggregates(transactions, viewPeriod, selectedMonth, selectedYear);
    }

    const periodFiltered = filterTransactionsByPeriod(transactions, viewPeriod, selectedMonth, selectedYear);
    const filteredTransactions = filterTransactionsBySearch(periodFiltered, searchQuery);
    const includeMonthlyBreakdown = viewPeriod === VIEW_PERIODS.YEARLY || viewPeriod === VIEW_PERIODS.ALL;

    return {
      ...aggregateTransactions(filteredTransactions, { includeMonthlyBreakdown }),
      filteredTransactions,
    };
  }, [transactions, viewPeriod, selectedMonth, selectedYear, searchQuery]);
};
