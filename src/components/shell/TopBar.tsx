"use client";

import { UI_TEXT } from "@constants";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { cn } from "@utils/cn";
import { PeriodPicker } from "./PeriodPicker";
import { TAB_TITLES } from "./navigation";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const activeTab = useAppSelector((state) => state.ui.activeTab);
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((state) => state.ui);
  const transactions = useAppSelector((state) => state.transactions.items);
  const { formatCurrency } = useCurrencyFormatter();
  const { totalIncome, totalExpense } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
  );

  return (
    <header className="glass-nav sticky top-0 z-40 border-b border-primary-soft/60 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-brand-deep md:text-2xl">
            {TAB_TITLES[activeTab]}
          </h1>
          <div className="mt-1">
            <PeriodPicker />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-gray-400">{UI_TEXT.TOTAL_INCOME}</p>
            <p className={cn("text-sm font-semibold text-income")}>
              +₹{formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-gray-400">{UI_TEXT.TOTAL_EXPENSES}</p>
            <p className={cn("text-sm font-semibold text-expense")}>
              -₹{formatCurrency(totalExpense)}
            </p>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
