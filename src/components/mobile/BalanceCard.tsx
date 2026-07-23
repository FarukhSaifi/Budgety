"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";

import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  KeyboardArrowDownIcon,
  MoreHorizIcon,
  VisibilityIcon,
  VisibilityOffIcon,
} from "@components/icons";

import { cn } from "@utils/cn";

export interface BalanceCardProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeDeltaPct?: number | null;
  expenseDeltaPct?: number | null;
  formatCurrency: (n: number) => string;
  hidden?: boolean;
  onToggleHidden?: () => void;
  className?: string;
}

export function BalanceCard({
  balance,
  monthlyIncome,
  monthlyExpense,
  incomeDeltaPct,
  expenseDeltaPct,
  formatCurrency,
  hidden = false,
  onToggleHidden,
  className,
}: BalanceCardProps) {
  const mask = (n: number) => (hidden ? "••••••" : `${CURRENCY_SYMBOL}${formatCurrency(n)}`);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1A2B88] via-[#3B41C8] to-[#6B5CE7] p-5 text-white shadow-elevated",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-[#00Dbe9]/10 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
        >
          {UI_TEXT.MAIN_ACCOUNT}
          <KeyboardArrowDownIcon className="h-4 w-4" />
        </button>
        <button type="button" className="rounded-full p-1.5 hover:bg-white/10" aria-label="More">
          <MoreHorizIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mt-5">
        <p className="text-sm text-white/70">{UI_TEXT.TOTAL_BALANCE}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-display-balance text-3xl tracking-tight md:text-4xl">
            {mask(balance)}
          </p>
          {onToggleHidden && (
            <button
              type="button"
              onClick={onToggleHidden}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={hidden ? "Show balance" : "Hide balance"}
            >
              {hidden ? (
                <VisibilityOffIcon className="h-5 w-5" />
              ) : (
                <VisibilityIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
        <div>
          <p className="text-xs text-white/60">{UI_TEXT.MONTHLY_INCOME}</p>
          <p className="mt-1 text-sm font-semibold">{mask(monthlyIncome)}</p>
          {incomeDeltaPct != null && (
            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[11px] font-medium text-emerald-200">
              <ArrowUpwardIcon className="h-3 w-3" />
              +{Math.abs(incomeDeltaPct).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-white/60">{UI_TEXT.MONTHLY_EXPENSE}</p>
          <p className="mt-1 text-sm font-semibold">{mask(monthlyExpense)}</p>
          {expenseDeltaPct != null && (
            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-rose-400/20 px-1.5 py-0.5 text-[11px] font-medium text-rose-200">
              <ArrowDownwardIcon className="h-3 w-3" />
              -{Math.abs(expenseDeltaPct).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
