"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";
import { cn } from "@utils/cn";

export interface BillsSummaryBarProps {
  total: number;
  formatCurrency: (n: number) => string;
  onPaySelected: () => void;
  paying?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Sticky mobile summary above bottom nav — Total Due (7 Days) + Pay Selected. */
export function BillsSummaryBar({
  total,
  formatCurrency,
  onPaySelected,
  paying = false,
  disabled = false,
  className,
}: BillsSummaryBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[72px] z-30 px-margin-mobile md:hidden",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-elevated backdrop-blur-md">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            {UI_TEXT.TOTAL_DUE_7_DAYS}
          </p>
          <p className="mt-0.5 text-xl font-bold leading-none text-brand-deep">
            {CURRENCY_SYMBOL}
            {formatCurrency(total)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || paying || total <= 0}
          onClick={onPaySelected}
          className="shrink-0 rounded-xl bg-primary-main px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying ? UI_TEXT.LOADING : UI_TEXT.PAY_SELECTED}
        </button>
      </div>
    </div>
  );
}
