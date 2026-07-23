"use client";

import type { ReactNode } from "react";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";

import {
  AccountBalanceIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckCircleIcon,
} from "@components/icons";
import type { IconComponent } from "@components/icons/types";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface SummaryCard {
  title: string;
  value: number;
  hint: ReactNode;
  Icon: IconComponent;
  iconWrap: string;
  watermark: string;
}

export default function SummaryCards({
  totalIncome,
  totalExpense,
  balance,
}: SummaryCardsProps) {
  const { formatCurrency } = useCurrencyFormatter();

  const cards: SummaryCard[] = [
    {
      title: UI_TEXT.TOTAL_BALANCE,
      value: balance,
      hint: (
        <span className="inline-flex items-center gap-1 rounded-full bg-income-soft px-2.5 py-1 text-[11px] font-semibold text-income">
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
        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
          {UI_TEXT.THIS_PERIOD}
        </span>
      ),
      Icon: ArrowUpwardIcon,
      iconWrap: "bg-income-soft text-income",
      watermark: "text-income-soft",
    },
    {
      title: UI_TEXT.TOTAL_EXPENSES,
      value: totalExpense,
      hint: (
        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
          {UI_TEXT.THIS_PERIOD}
        </span>
      ),
      Icon: ArrowDownwardIcon,
      iconWrap: "bg-expense-soft text-expense",
      watermark: "text-expense-soft",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.Icon;
        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-card p-5 shadow-card md:p-6"
          >
            <Icon
              className={`pointer-events-none absolute -right-1 -top-1 h-24 w-24 opacity-40 ${card.watermark}`}
              aria-hidden
            />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
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
}
