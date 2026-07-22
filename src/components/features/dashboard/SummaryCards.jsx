"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import {
  AccountBalanceIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckCircleIcon,
} from "@components/icons";

const SummaryCards = ({ totalIncome, totalExpense, balance }) => {
  const { formatCurrency } = useCurrencyFormatter();

  const cards = [
    {
      title: UI_TEXT.TOTAL_BALANCE,
      value: balance,
      hint: (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-income">
          <CheckCircleIcon className="h-3 w-3" />
          {UI_TEXT.AVAILABLE_BALANCE}
        </span>
      ),
      Icon: AccountBalanceIcon,
      iconWrap: "bg-primary-soft/70 text-primary-main",
      watermark: "text-primary-soft",
    },
    {
      title: UI_TEXT.TOTAL_INCOME,
      value: totalIncome,
      hint: (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          {UI_TEXT.THIS_PERIOD}
        </span>
      ),
      Icon: ArrowUpwardIcon,
      iconWrap: "bg-emerald-50 text-income",
      watermark: "text-emerald-100",
    },
    {
      title: UI_TEXT.TOTAL_EXPENSES,
      value: totalExpense,
      hint: (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          {UI_TEXT.THIS_PERIOD}
        </span>
      ),
      Icon: ArrowDownwardIcon,
      iconWrap: "bg-rose-50 text-expense",
      watermark: "text-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.Icon;
        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-2xl border border-gray-100/80 bg-white p-5 shadow-card md:p-6"
          >
            <Icon
              className={`pointer-events-none absolute -right-1 -top-1 h-24 w-24 opacity-40 ${card.watermark}`}
              aria-hidden
            />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {card.title}
                </p>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconWrap}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-brand-deep md:text-[1.75rem]">
                {CURRENCY_SYMBOL}
                {formatCurrency(card.value)}
              </p>
              <div className="mt-3">{card.hint}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
