"use client";

import { useEffect, useMemo, useState } from "react";

import { CURRENCY_SYMBOL, MONTHS, UI_TEXT } from "@constants";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { cn } from "@utils/cn";
import { daysInMonth, getMonthYear, startOfMonthDayOfWeek } from "@utils/dateUtils";
import { shiftMonthYear } from "@utils/periodFilter";

import type { Transaction } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface TransactionCalendarProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onSelect: (transaction: Transaction) => void;
  /** When true, calendar shows prev/next month controls (yearly / all / range). */
  showMonthNav?: boolean;
  onMonthChange?: (month: number, year: number) => void;
}

export function TransactionCalendar({
  transactions,
  month,
  year,
  onSelect,
  showMonthNav = false,
  onMonthChange,
}: TransactionCalendarProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDay(null);
  }, [month, year]);

  const byDay = useMemo(() => {
    const map = new Map<number, Transaction[]>();
    transactions.forEach((t) => {
      const my = getMonthYear(t.date);
      if (!my || my.month !== month || my.year !== year) return;
      const day = new Date(t.date).getDate();
      const list = map.get(day) ?? [];
      list.push(t);
      map.set(day, list);
    });
    return map;
  }, [transactions, month, year]);

  const dayTransactions = selectedDay != null ? (byDay.get(selectedDay) ?? []) : [];

  const totalDays = daysInMonth(year, month);
  const leadingBlanks = startOfMonthDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number) => {
    const next = shiftMonthYear(month, year, delta);
    onMonthChange?.(next.month, next.year);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-card border border-outline-variant/50 bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          {showMonthNav ? (
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-low text-brand-deep ring-1 ring-outline-variant/60 transition hover:bg-primary-soft"
              aria-label={UI_TEXT.PREVIOUS_CALENDAR_MONTH}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-9" aria-hidden />
          )}
          <p className="text-center text-sm font-semibold text-brand-deep">
            {MONTHS[month - 1]} {year}
          </p>
          {showMonthNav ? (
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-low text-brand-deep ring-1 ring-outline-variant/60 transition hover:bg-primary-soft"
              aria-label={UI_TEXT.NEXT_CALENDAR_MONTH}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-9" aria-hidden />
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-on-surface-variant">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`blank-${idx}`} className="min-h-16 rounded-lg" />;
            const items = byDay.get(day) ?? [];
            const dayTotal = items.reduce(
              (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
              0,
            );
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "min-h-16 rounded-lg border p-1 text-left transition",
                  isSelected
                    ? "border-primary-main bg-primary-soft/60 ring-1 ring-primary-main/30"
                    : "border-outline-variant/40 hover:border-primary-main/40 hover:bg-surface-low",
                )}
                aria-pressed={isSelected}
                aria-label={`${day} ${MONTHS[month - 1]}`}
              >
                <div className="text-xs font-semibold text-on-surface-variant">{day}</div>
                {items.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    <span
                      className={cn(
                        "block px-0.5 text-xs font-semibold tabular-nums",
                        dayTotal >= 0 ? "text-income" : "text-expense",
                      )}
                    >
                      {dayTotal >= 0 ? UI_TEXT.INCOME_SYMBOL : UI_TEXT.EXPENSE_SYMBOL}
                      {CURRENCY_SYMBOL}
                      {formatCurrency(Math.abs(dayTotal), {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="block px-0.5 text-xs text-on-surface-variant">
                      {items.length} {UI_TEXT.TRANSACTION_S.toLowerCase()}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay != null && (
        <div
          className="rounded-card border border-outline-variant/50 bg-card p-4 shadow-card"
          role="region"
          aria-label={UI_TEXT.CALENDAR_DAY_TRANSACTIONS}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-brand-deep">
              {selectedDay} {MONTHS[month - 1]} {year}
            </p>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-low"
              aria-label={UI_TEXT.CLEAR_FILTER}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {dayTransactions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">{UI_TEXT.NO_TRANSACTIONS}</p>
          ) : (
            <ul className="space-y-2">
              {dayTransactions.map((t) => {
                const isIncome = t.type === "income";
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(t)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-low/80 px-3 py-2.5 text-left transition hover:bg-primary-soft/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-deep">
                          {t.title || t.description || t.category}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">{t.category}</p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          isIncome ? "text-income" : "text-expense",
                        )}
                      >
                        {isIncome ? UI_TEXT.INCOME_SYMBOL : UI_TEXT.EXPENSE_SYMBOL}
                        {CURRENCY_SYMBOL}
                        {formatCurrency(Math.abs(t.amount || 0))}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
