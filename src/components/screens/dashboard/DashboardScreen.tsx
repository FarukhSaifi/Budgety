"use client";

import { useMemo } from "react";

import { CURRENCY_SYMBOL, DEFAULT_VALUES, DISPLAY_LIMITS, TRANSACTION_TYPES, UI_TEXT } from "@constants";

import CategoryBreakdownChart from "@components/features/dashboard/CategoryBreakdownChart";
import MonthlyTrendChart from "@components/features/dashboard/MonthlyTrendChart";
import { NetWorthWidget } from "@components/features/dashboard/NetWorthWidget";
import { RecentTransactionsCard } from "@components/features/dashboard/RecentTransactionsCard";
import { SafeToSpendWidget } from "@components/features/dashboard/SafeToSpendWidget";
import { SubscriptionAlertWidget } from "@components/features/dashboard/SubscriptionAlertWidget";
import SummaryCards from "@components/features/dashboard/SummaryCards";
import { ChevronRightIcon, NotificationsIcon } from "@components/icons";
import { BillPreviewRow, BudgetProgress } from "@components/mobile";
import { PeriodPicker } from "@components/shell/PeriodPicker";

import { useAppNavigation } from "@hooks/useAppNavigation";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { selectPeriodAggregates } from "@store/selectors/periodSelectors";

function daysUntil(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueShort(dueDate: string): string {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function DashboardScreen() {
  const navigateToTab = useAppNavigation();
  const user = useAppSelector((s) => s.auth.user);
  const transactions = useAppSelector((s) => s.transactions.items);
  const budgets = useAppSelector((s) => s.budgets.items);
  const bills = useAppSelector((s) => s.bills.items);
  const goals = useAppSelector((s) => s.goals.items);
  const debts = useAppSelector((s) => s.debt.items);
  const current = useAppSelector(selectPeriodAggregates);
  const { formatCurrency } = useCurrencyFormatter();

  const totalBalance = useMemo(() => {
    const allIncome = transactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    const allExpense = transactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    return allIncome - allExpense;
  }, [transactions]);

  const totalDebt = useMemo(
    () => debts.reduce((sum, d) => sum + (d.balance || 0), 0),
    [debts],
  );

  const safeToSpend = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.max(1, end.getDate() - now.getDate() + 1);
    const upcomingBillTotal = bills
      .filter((b) => !b.isPaid && b.status !== "paid")
      .filter((b) => {
        const due = new Date(b.dueDate);
        return (
          due.getMonth() === now.getMonth() &&
          due.getFullYear() === now.getFullYear() &&
          due >= now
        );
      })
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const remainingGoalTarget = goals.reduce(
      (sum, g) => sum + Math.max(0, (g.targetAmount || 0) - (g.savedAmount || 0)) / 12,
      0,
    );
    const amount = current.totalIncome - current.totalExpense - upcomingBillTotal - remainingGoalTarget;
    return {
      amount,
      daysLeft,
      dailyAmount: amount / daysLeft,
    };
  }, [bills, current.totalExpense, current.totalIncome, goals]);

  const budgetLimit = useMemo(
    () =>
      budgets
        .filter((b) => b.period === "monthly")
        .reduce((sum, b) => sum + (b.limitAmount || 0) + (b.rolloverBalance || 0), 0),
    [budgets],
  );

  const upcomingBills = useMemo(() => {
    return [...bills]
      .filter((b) => !b.isPaid && b.status !== "paid")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, DISPLAY_LIMITS.PREVIEW_ITEMS);
  }, [bills]);

  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initial = firstName.charAt(0).toUpperCase();
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-6xl md:space-y-5 lg:max-w-7xl">
      {/* Mobile greeting — desktop TopBar already covers search / profile */}
      <header className="flex items-center justify-between gap-3 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-lg font-bold text-primary-main">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt={firstName} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-brand-deep">Good morning, {firstName}</h1>
            <p className="truncate text-sm text-gray-400">Here is your wealth summary · {todayLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateToTab("bills")}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft/60 text-brand-deep"
          aria-label={UI_TEXT.NOTIFICATIONS}
        >
          <NotificationsIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="md:hidden">
        <PeriodPicker />
      </div>

      <SummaryCards totalIncome={current.totalIncome} totalExpense={current.totalExpense} balance={totalBalance} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SafeToSpendWidget
          amount={safeToSpend.amount}
          daysLeft={safeToSpend.daysLeft}
          dailyAmount={safeToSpend.dailyAmount}
        />
        <NetWorthWidget assets={totalBalance} debt={totalDebt} />
      </div>

      <SubscriptionAlertWidget />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <MonthlyTrendChart className="lg:col-span-3" />
        <CategoryBreakdownChart className="lg:col-span-2" />
      </div>

      <RecentTransactionsCard />

      <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-card md:p-5">
        <BudgetProgress
          spent={current.totalExpense}
          limit={budgetLimit || current.totalExpense || 1}
          formatCurrency={formatCurrency}
        />
      </div>

      <section className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-card md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-deep">{UI_TEXT.UPCOMING_BILLS}</h3>
          <button
            type="button"
            onClick={() => navigateToTab("bills")}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary-main"
          >
            {UI_TEXT.VIEW_ALL}
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        {upcomingBills.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">{UI_TEXT.NO_BILL_REMINDERS}</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {upcomingBills.map((bill) => (
              <li key={bill.id}>
                <BillPreviewRow
                  bill={bill}
                  formatCurrency={formatCurrency}
                  formatDue={formatDueShort}
                  daysLeft={daysUntil(bill.dueDate)}
                  onClick={() => navigateToTab("bills")}
                  className="rounded-none bg-transparent px-0 shadow-none"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="hidden text-center text-xs text-gray-400 md:block">
        {UI_TEXT.NET_BALANCE}: {CURRENCY_SYMBOL}
        {formatCurrency(current.balance)} · {UI_TEXT.THIS_PERIOD}
      </p>
    </div>
  );
}
