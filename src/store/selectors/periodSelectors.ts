import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@store/index";
import { computePeriodAggregates } from "@utils/periodFilter";

const selectTransactions = (state: RootState) => state.transactions.items;
const selectViewPeriod = (state: RootState) => state.ui.viewPeriod;
const selectSelectedMonth = (state: RootState) => state.ui.selectedMonth;
const selectSelectedYear = (state: RootState) => state.ui.selectedYear;

/**
 * Memoized period aggregates shared by AppShell, TopBar, and any screen
 * that does not apply a search query. Recomputes only when txs/period change.
 */
export const selectPeriodAggregates = createSelector(
  [selectTransactions, selectViewPeriod, selectSelectedMonth, selectSelectedYear],
  (transactions, viewPeriod, selectedMonth, selectedYear) =>
    computePeriodAggregates(transactions, viewPeriod, selectedMonth, selectedYear),
);

export const selectPeriodTotalExpense = createSelector([selectPeriodAggregates], (agg) => agg.totalExpense);

export const selectPeriodTotalIncome = createSelector([selectPeriodAggregates], (agg) => agg.totalIncome);

export const selectPeriodBalance = createSelector([selectPeriodAggregates], (agg) => agg.balance);

export const selectSpendingByCategory = createSelector([selectPeriodAggregates], (agg) => agg.spendingByCategory);

export const selectFilteredTransactions = createSelector([selectPeriodAggregates], (agg) => agg.filteredTransactions);
