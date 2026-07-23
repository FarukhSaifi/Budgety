"use client";

import { UI_TEXT } from "@constants";

import { LightbulbIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";

interface SafeToSpendWidgetProps {
  amount: number;
  daysLeft: number;
  dailyAmount: number;
}

/** Real-time disposable income after upcoming bills and savings targets. */
export function SafeToSpendWidget({ amount, daysLeft, dailyAmount }: SafeToSpendWidgetProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const safe = Math.max(0, amount);

  return (
    <section className="rounded-2xl border border-primary-soft/80 bg-gradient-to-br from-primary-soft/40 via-card to-card p-4 shadow-card md:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-main/15 text-primary-main">
          <LightbulbIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-on-surface-variant">{UI_TEXT.SAFE_TO_SPEND}</h3>
          <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep">
            ₹{formatCurrency(safe)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {daysLeft > 0
              ? `≈ ₹${formatCurrency(dailyAmount)} / day · ${daysLeft} days left this month`
              : "End of month — review upcoming bills and goals"}
          </p>
        </div>
      </div>
    </section>
  );
}
