import { DEFAULT_VALUES, MONTHS, TRANSACTION_TYPES, VIEW_PERIODS } from "@constants";

import { getMonthYear, type MonthYear } from "@utils/dateUtils";

import type { Transaction, ViewPeriod } from "@/types";

export interface MonthlyBreakdownEntry {
  month: number;
  year: number;
  income: number;
  expense: number;
}

export interface PeriodAggregates {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  spendingByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  monthlyBreakdown: MonthlyBreakdownEntry[];
  filteredTransactions: Transaction[];
}

export interface RollingMonthPoint {
  key: string;
  label: string;
  Income: number;
  Expense: number;
}

/** Whether a parsed month/year falls inside the active UI period. */
export function matchesPeriod(
  monthYear: MonthYear,
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): boolean {
  if (viewPeriod === VIEW_PERIODS.ALL) return true;
  if (viewPeriod === VIEW_PERIODS.MONTHLY) {
    return monthYear.month === selectedMonth && monthYear.year === selectedYear;
  }
  if (viewPeriod === VIEW_PERIODS.YEARLY) {
    return monthYear.year === selectedYear;
  }
  return true;
}

/** Filter transactions by Redux UI period (monthly / yearly / all). */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): Transaction[] {
  if (viewPeriod === VIEW_PERIODS.ALL) return transactions;
  if (!transactions.length) return transactions;

  return transactions.filter((transaction) => {
    const monthYear = getMonthYear(transaction.date);
    if (!monthYear) return false;
    return matchesPeriod(monthYear, viewPeriod, selectedMonth, selectedYear);
  });
}

/** Shift calendar month by `delta` (±1, etc.). Month is 1–12. */
export function shiftMonthYear(month: number, year: number, delta: number): MonthYear {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/** Previous period relative to the current UI selection (for MoM / YoY). */
export function getPreviousPeriod(
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): { viewPeriod: ViewPeriod; selectedMonth: number; selectedYear: number } {
  if (viewPeriod === VIEW_PERIODS.YEARLY) {
    return {
      viewPeriod,
      selectedMonth,
      selectedYear: selectedYear - 1,
    };
  }
  if (viewPeriod === VIEW_PERIODS.ALL) {
    return { viewPeriod, selectedMonth, selectedYear };
  }
  const prev = shiftMonthYear(selectedMonth, selectedYear, -1);
  return {
    viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
    selectedMonth: prev.month,
    selectedYear: prev.year,
  };
}

/** Most recent calendar month that has at least one transaction. */
export function mostRecentTransactionMonth(transactions: Transaction[]): MonthYear | null {
  let best: { month: number; year: number; key: string } | null = null;
  for (const tx of transactions) {
    const my = getMonthYear(tx.date);
    if (!my) continue;
    const key = `${my.year}-${String(my.month).padStart(2, "0")}`;
    if (!best || key > best.key) {
      best = { month: my.month, year: my.year, key };
    }
  }
  return best ? { month: best.month, year: best.year } : null;
}

/**
 * Single-pass aggregates for a transaction list already scoped to a period
 * (or the full list). Parses each date at most once.
 */
export function aggregateTransactions(
  transactions: Transaction[],
  options: { includeMonthlyBreakdown?: boolean } = {},
): Omit<PeriodAggregates, "filteredTransactions"> & {
  filteredTransactions: Transaction[];
} {
  const includeMonthlyBreakdown = options.includeMonthlyBreakdown ?? false;
  let totalIncome = DEFAULT_VALUES.BALANCE;
  let totalExpense = DEFAULT_VALUES.BALANCE;
  const spendingByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};
  const monthlyBreakdownMap: Record<string, MonthlyBreakdownEntry> = {};

  for (const t of transactions) {
    const amount = t.amount || DEFAULT_VALUES.AMOUNT;
    const category = t.category || "Other";
    const isIncome = t.type === TRANSACTION_TYPES.INCOME;

    if (isIncome) {
      totalIncome += amount;
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
    } else if (t.type === TRANSACTION_TYPES.EXPENSE) {
      totalExpense += amount;
      spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
    }

    if (includeMonthlyBreakdown) {
      const monthYear = getMonthYear(t.date);
      if (!monthYear) continue;
      const key = `${monthYear.year}-${String(monthYear.month).padStart(2, "0")}`;
      let bucket = monthlyBreakdownMap[key];
      if (!bucket) {
        bucket = {
          month: monthYear.month,
          year: monthYear.year,
          income: 0,
          expense: 0,
        };
        monthlyBreakdownMap[key] = bucket;
      }
      if (isIncome) bucket.income += amount;
      else if (t.type === TRANSACTION_TYPES.EXPENSE) bucket.expense += amount;
    }
  }

  const monthlyBreakdown = includeMonthlyBreakdown
    ? Object.values(monthlyBreakdownMap).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
    : [];

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    spendingByCategory,
    incomeByCategory,
    monthlyBreakdown,
    filteredTransactions: transactions,
  };
}

/**
 * Filter by period (and optional search pre-filter handled by caller), then
 * aggregate in one pass. Shared by hooks + Redux selectors.
 */
export function computePeriodAggregates(
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): PeriodAggregates {
  const filteredTransactions = filterTransactionsByPeriod(transactions, viewPeriod, selectedMonth, selectedYear);
  const includeMonthlyBreakdown = viewPeriod === VIEW_PERIODS.YEARLY || viewPeriod === VIEW_PERIODS.ALL;

  const aggregates = aggregateTransactions(filteredTransactions, {
    includeMonthlyBreakdown,
  });

  return {
    ...aggregates,
    filteredTransactions,
  };
}

/**
 * Rolling N-month income/expense series ending at (anchorMonth, anchorYear).
 * Single scan of transactions; O(txs + N).
 */
export function buildRollingMonthTrend(
  transactions: Transaction[],
  anchorMonth: number,
  anchorYear: number,
  monthCount: number,
): RollingMonthPoint[] {
  const months: RollingMonthPoint[] = [];
  const index = new Map<string, RollingMonthPoint>();

  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const { month, year } = shiftMonthYear(anchorMonth, anchorYear, -i);
    const key = `${year}-${month}`;
    const point: RollingMonthPoint = {
      key,
      label: MONTHS[month - 1]?.slice(0, 3) ?? String(month),
      Income: 0,
      Expense: 0,
    };
    months.push(point);
    index.set(key, point);
  }

  for (const t of transactions) {
    const my = getMonthYear(t.date);
    if (!my) continue;
    const entry = index.get(`${my.year}-${my.month}`);
    if (!entry) continue;
    const amount = t.amount || 0;
    if (t.type === TRANSACTION_TYPES.INCOME) entry.Income += amount;
    else if (t.type === TRANSACTION_TYPES.EXPENSE) entry.Expense += amount;
  }

  return months;
}
