"use client";

import { CURRENCY_SYMBOL, MONTHS, UI_TEXT } from "@constants";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { daysInMonth, getMonthYear, startOfMonthDayOfWeek } from "@utils/dateUtils";
import type { Transaction } from "@/types";
import { useMemo } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface TransactionCalendarProps {
  transactions: Transaction[];
  month: number;
  year: number;
  onSelect: (transaction: Transaction) => void;
}

export function TransactionCalendar({
  transactions,
  month,
  year,
  onSelect,
}: TransactionCalendarProps) {
  const { formatCurrency } = useCurrencyFormatter();

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

  const totalDays = daysInMonth(year, month);
  const leadingBlanks = startOfMonthDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-card border border-gray-100 bg-white p-4 shadow-card">
      <p className="mb-3 text-center text-sm font-semibold text-gray-900">
        {MONTHS[month - 1]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400">
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
          return (
            <div
              key={day}
              className="min-h-16 rounded-lg border border-gray-100 p-1 text-left"
            >
              <div className="text-[11px] font-semibold text-gray-500">{day}</div>
              <div className="space-y-0.5">
                {items.slice(0, 2).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelect(t)}
                    className={
                      "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium " +
                      (t.type === "income"
                        ? "bg-green-50 text-income"
                        : "bg-red-50 text-expense")
                    }
                    title={t.title || t.description}
                  >
                    {t.title || t.category}
                  </button>
                ))}
                {items.length > 2 && (
                  <span className="block px-1 text-[10px] text-gray-400">
                    +{items.length - 2}
                  </span>
                )}
                {items.length > 0 && (
                  <span
                    className={
                      "block px-1 text-[10px] font-semibold " +
                      (dayTotal >= 0 ? "text-income" : "text-expense")
                    }
                  >
                    {dayTotal >= 0 ? UI_TEXT.INCOME_SYMBOL : UI_TEXT.EXPENSE_SYMBOL}
                    {CURRENCY_SYMBOL}
                    {formatCurrency(Math.abs(dayTotal), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
