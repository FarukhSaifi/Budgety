import { useMemo } from "react";
import { TRANSACTION_TYPES, VIEW_PERIODS } from "../constants";
import { filterTransactionsBySearch } from "../utils/searchUtils";

// Helper function to parse date
const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Helper function to get month and year from date
const getMonthYear = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return null;
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

// Filter transactions based on view period
const filterTransactionsByPeriod = (
  transactions,
  viewPeriod,
  selectedMonth,
  selectedYear
) => {
  if (viewPeriod === VIEW_PERIODS.ALL) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const monthYear = getMonthYear(transaction.date);
    if (!monthYear) return false;

    if (viewPeriod === VIEW_PERIODS.MONTHLY) {
      return (
        monthYear.month === selectedMonth && monthYear.year === selectedYear
      );
    }

    if (viewPeriod === VIEW_PERIODS.YEARLY) {
      return monthYear.year === selectedYear;
    }

    return true;
  });
};

export const useBudgetCalculations = (
  transactions,
  viewPeriod,
  selectedMonth,
  selectedYear,
  searchQuery = ""
) => {
  return useMemo(() => {
    // First filter by period
    let filteredTransactions = filterTransactionsByPeriod(
      transactions,
      viewPeriod,
      selectedMonth,
      selectedYear
    );

    // Then filter by search query if provided
    if (searchQuery) {
      filteredTransactions = filterTransactionsBySearch(
        filteredTransactions,
        searchQuery
      );
    }

    const totalIncome = filteredTransactions
      .filter((transaction) => transaction.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const totalExpense = filteredTransactions
      .filter((transaction) => transaction.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const balance = totalIncome - totalExpense;
    const netSavings = balance;

    // Calculate spending by category
    const spendingByCategory = filteredTransactions
      .filter((transaction) => transaction.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((acc, transaction) => {
        const category = transaction.category || "Other";
        acc[category] = (acc[category] || 0) + (transaction.amount || 0);
        return acc;
      }, {});

    // Calculate income by category
    const incomeByCategory = filteredTransactions
      .filter((transaction) => transaction.type === TRANSACTION_TYPES.INCOME)
      .reduce((acc, transaction) => {
        const category = transaction.category || "Other";
        acc[category] = (acc[category] || 0) + (transaction.amount || 0);
        return acc;
      }, {});

    // Monthly breakdown (for yearly view)
    const monthlyBreakdown = {};
    if (viewPeriod === VIEW_PERIODS.YEARLY || viewPeriod === VIEW_PERIODS.ALL) {
      filteredTransactions.forEach((transaction) => {
        const monthYear = getMonthYear(transaction.date);
        if (!monthYear) return;

        const key = `${monthYear.year}-${String(monthYear.month).padStart(
          2,
          "0"
        )}`;
        if (!monthlyBreakdown[key]) {
          monthlyBreakdown[key] = {
            month: monthYear.month,
            year: monthYear.year,
            income: 0,
            expense: 0,
          };
        }

        if (transaction.type === TRANSACTION_TYPES.INCOME) {
          monthlyBreakdown[key].income += transaction.amount || 0;
        } else {
          monthlyBreakdown[key].expense += transaction.amount || 0;
        }
      });
    }

    return {
      totalIncome,
      totalExpense,
      balance,
      netSavings,
      spendingByCategory,
      incomeByCategory,
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      }),
      filteredTransactions,
    };
  }, [transactions, viewPeriod, selectedMonth, selectedYear, searchQuery]);
};
