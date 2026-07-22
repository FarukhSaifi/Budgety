import { DEFAULT_VALUES, TRANSACTION_TYPES, VIEW_PERIODS } from "@constants";
import { getMonthYear } from "@utils/dateUtils";
import { filterTransactionsBySearch } from "@utils/searchUtils";
import type { Transaction, ViewPeriod } from "@/types";
import { useMemo } from "react";

export interface MonthlyBreakdownEntry {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface BudgetCalculations {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  spendingByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  monthlyBreakdown: MonthlyBreakdownEntry[];
  filteredTransactions: Transaction[];
}

function filterTransactionsByPeriod(
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): Transaction[] {
  if (viewPeriod === VIEW_PERIODS.ALL) return transactions;

  return transactions.filter((transaction) => {
    const monthYear = getMonthYear(transaction.date);
    if (!monthYear) return false;
    if (viewPeriod === VIEW_PERIODS.MONTHLY) {
      return monthYear.month === selectedMonth && monthYear.year === selectedYear;
    }
    if (viewPeriod === VIEW_PERIODS.YEARLY) {
      return monthYear.year === selectedYear;
    }
    return true;
  });
}

/**
 * Core aggregation used by the dashboard, reports and transaction views.
 * Pure + memoized; filters by period and (optionally) a search query.
 */
export const useBudgetCalculations = (
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
  searchQuery = "",
): BudgetCalculations => {
  return useMemo(() => {
    let filteredTransactions = filterTransactionsByPeriod(
      transactions,
      viewPeriod,
      selectedMonth,
      selectedYear,
    );

    if (searchQuery) {
      filteredTransactions = filterTransactionsBySearch(filteredTransactions, searchQuery);
    }

    const totalIncome = filteredTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);

    const balance = totalIncome - totalExpense;

    const spendingByCategory = filteredTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce<Record<string, number>>((acc, t) => {
        const category = t.category || "Other";
        acc[category] = (acc[category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    const incomeByCategory = filteredTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce<Record<string, number>>((acc, t) => {
        const category = t.category || "Other";
        acc[category] = (acc[category] || 0) + (t.amount || 0);
        return acc;
      }, {});

    const monthlyBreakdownMap: Record<string, MonthlyBreakdownEntry> = {};
    if (viewPeriod === VIEW_PERIODS.YEARLY || viewPeriod === VIEW_PERIODS.ALL) {
      filteredTransactions.forEach((t) => {
        const monthYear = getMonthYear(t.date);
        if (!monthYear) return;
        const key = `${monthYear.year}-${String(monthYear.month).padStart(2, "0")}`;
        if (!monthlyBreakdownMap[key]) {
          monthlyBreakdownMap[key] = {
            month: monthYear.month,
            year: monthYear.year,
            income: 0,
            expense: 0,
          };
        }
        if (t.type === TRANSACTION_TYPES.INCOME) {
          monthlyBreakdownMap[key].income += t.amount || 0;
        } else {
          monthlyBreakdownMap[key].expense += t.amount || 0;
        }
      });
    }

    const monthlyBreakdown = Object.values(monthlyBreakdownMap).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      spendingByCategory,
      incomeByCategory,
      monthlyBreakdown,
      filteredTransactions,
    };
  }, [transactions, viewPeriod, selectedMonth, selectedYear, searchQuery]);
};
