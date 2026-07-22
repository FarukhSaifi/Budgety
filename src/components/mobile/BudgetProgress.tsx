"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";
import { cn } from "@utils/cn";

export interface BudgetProgressProps {
  spent: number;
  limit: number;
  formatCurrency: (n: number) => string;
  title?: string;
  className?: string;
}

export function BudgetProgress({
  spent,
  limit,
  formatCurrency,
  title = UI_TEXT.MONTHLY_BUDGET,
  className,
}: BudgetProgressProps) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-base font-bold text-brand-deep">{title}</h3>
      <div className="h-3 overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-main to-primary-light transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500">
          {UI_TEXT.SPENT} {CURRENCY_SYMBOL}
          {formatCurrency(spent)} / {CURRENCY_SYMBOL}
          {formatCurrency(limit)}
        </p>
        <p className="font-semibold text-brand-deep">{Math.round(pct)}%</p>
      </div>
    </section>
  );
}
