"use client";

import { useMemo } from "react";

import { CURRENCY_SYMBOL, MONTHS, UI_TEXT } from "@constants";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { daysInMonth, getMonthYear, startOfMonthDayOfWeek } from "@utils/dateUtils";

import type { Bill } from "@/types";

import { isBillPaid } from "./billHelpers";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface PaymentsCalendarProps {
  bills: Bill[];
  month: number;
  year: number;
}

export function PaymentsCalendar({ bills, month, year }: PaymentsCalendarProps) {
  const { formatCurrency } = useCurrencyFormatter();

  const byDay = useMemo(() => {
    const map = new Map<number, Bill[]>();
    bills.forEach((b) => {
      const my = getMonthYear(b.dueDate);
      if (!my || my.month !== month || my.year !== year) return;
      const day = new Date(b.dueDate).getDate();
      const list = map.get(day) ?? [];
      list.push(b);
      map.set(day, list);
    });
    return map;
  }, [bills, month, year]);

  const totalDays = daysInMonth(year, month);
  const leadingBlanks = startOfMonthDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-card border border-gray-100 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-gray-900">
        {UI_TEXT.PAYMENTS_CALENDAR} · {MONTHS[month - 1]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-gray-400 sm:gap-1 sm:text-[11px]">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="py-1">
            <span className="sm:hidden" aria-hidden>
              {UI_TEXT.CALENDAR_WEEKDAYS_NARROW[i]}
            </span>
            <span className="hidden sm:inline">{d}</span>
            <span className="sr-only sm:hidden">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, idx) => {
          if (day === null)
            return <div key={`blank-${idx}`} className="min-h-12 rounded-md sm:min-h-14 sm:rounded-lg" />;
          const items = byDay.get(day) ?? [];
          return (
            <div
              key={day}
              className="min-h-12 min-w-0 overflow-hidden rounded-md border border-gray-100 p-0.5 sm:min-h-14 sm:rounded-lg sm:p-1"
            >
              <div className="text-[11px] font-semibold text-gray-500">{day}</div>
              {items.slice(0, 2).map((b) => (
                <div
                  key={b.id}
                  className={
                    "mt-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium " +
                    (isBillPaid(b) ? "bg-green-50 text-income" : "bg-primary-soft text-primary-main")
                  }
                  title={`${b.title} · ${CURRENCY_SYMBOL}${formatCurrency(b.amount)}`}
                >
                  {b.title}
                </div>
              ))}
              {items.length > 2 && <span className="block px-1 text-[10px] text-gray-400">+{items.length - 2}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
