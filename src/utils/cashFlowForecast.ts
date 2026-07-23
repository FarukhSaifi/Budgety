import { TRANSACTION_TYPES } from "@constants";

import { getMonthYear } from "@utils/dateUtils";

import type { Bill, RecurringTransaction, Transaction } from "@/types";

export const DEFAULT_FORECAST_MONTHS_AHEAD = 3;

export type CashFlowOutlookPoint = {
  label: string;
  projectedIncome: number;
  projectedExpense: number;
  projectedNet: number;
};

export type CashFlowForecast = {
  avgIncome: number;
  avgExpense: number;
  avgNet: number;
  outlook: CashFlowOutlookPoint[];
};

export type CashFlowProjection = {
  projectedBalance: number;
  upcomingBillsTotal: number;
  recurringExpenseTotal: number;
  asOfDate: string;
  billCount: number;
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Pace-based multi-month forecast from recent transaction history.
 */
export function buildCashFlowForecast(
  transactions: Transaction[],
  lookbackMonths = 6,
  monthsAhead = DEFAULT_FORECAST_MONTHS_AHEAD,
): CashFlowForecast {
  const buckets = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const my = getMonthYear(t.date);
    if (!my) continue;
    const key = `${my.year}-${String(my.month).padStart(2, "0")}`;
    const cur = buckets.get(key) ?? { income: 0, expense: 0 };
    if (t.type === TRANSACTION_TYPES.INCOME) cur.income += Number(t.amount) || 0;
    else cur.expense += Number(t.amount) || 0;
    buckets.set(key, cur);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-lookbackMonths);
  const n = sorted.length || 1;
  const avgIncome = sorted.reduce((s, [, v]) => s + v.income, 0) / n;
  const avgExpense = sorted.reduce((s, [, v]) => s + v.expense, 0) / n;
  const avgNet = avgIncome - avgExpense;

  const now = new Date();
  const outlook: CashFlowOutlookPoint[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    outlook.push({
      label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      projectedIncome: Math.round(avgIncome),
      projectedExpense: Math.round(avgExpense),
      projectedNet: Math.round(avgNet),
    });
  }

  return {
    avgIncome: Math.round(avgIncome),
    avgExpense: Math.round(avgExpense),
    avgNet: Math.round(avgNet),
    outlook,
  };
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Project cash remaining by a near-term date from current balance minus unpaid
 * bills and a simple recurring expense estimate.
 */
export function projectCashByDate(params: {
  currentBalance: number;
  bills: Bill[];
  recurring?: RecurringTransaction[];
  daysAhead?: number;
}): CashFlowProjection {
  const daysAhead = Math.max(1, params.daysAhead ?? 14);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);
  const asOfDate = toDay(end);

  const upcoming = params.bills.filter((b) => {
    if (b.isPaid || b.status === "paid") return false;
    const due = new Date(b.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(0, 0, 0, 0);
    return due >= now && due <= end;
  });

  const upcomingBillsTotal = upcoming.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const recurringExpenseTotal = (params.recurring ?? [])
    .filter((r) => r.type === "expense" && r.isActive !== false)
    .reduce((s, r) => {
      const amount = Number(r.amount) || 0;
      if (r.recurrence === "weekly") return s + amount * Math.ceil(daysAhead / 7);
      if (r.recurrence === "daily") return s + amount * daysAhead;
      return s + (daysAhead >= 28 ? amount : 0);
    }, 0);

  return {
    projectedBalance: params.currentBalance - upcomingBillsTotal - recurringExpenseTotal,
    upcomingBillsTotal,
    recurringExpenseTotal,
    asOfDate,
    billCount: upcoming.length,
  };
}
