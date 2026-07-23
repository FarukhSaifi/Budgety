"use client";

import { UI_TEXT } from "@constants";

import { AccountBalanceIcon, CreditCardIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";

interface NetWorthWidgetProps {
  assets: number;
  debt: number;
}

export function NetWorthWidget({ assets, debt }: NetWorthWidgetProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const netWorth = assets - debt;

  return (
    <section className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-card md:p-5">
      <h3 className="text-sm font-semibold text-on-surface-variant">{UI_TEXT.NET_WORTH}</h3>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${
          netWorth >= 0 ? "text-income" : "text-expense"
        }`}
      >
        ₹{formatCurrency(netWorth)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-xl bg-income-soft/50 px-3 py-2">
          <AccountBalanceIcon className="h-4 w-4 text-income" />
          <div>
            <p className="text-on-surface-variant">Assets</p>
            <p className="font-semibold text-brand-deep">₹{formatCurrency(assets)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-expense-soft/50 px-3 py-2">
          <CreditCardIcon className="h-4 w-4 text-expense" />
          <div>
            <p className="text-on-surface-variant">Debt</p>
            <p className="font-semibold text-brand-deep">₹{formatCurrency(debt)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
