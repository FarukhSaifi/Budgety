"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";

import { EmptyState } from "@common";

import { EventNoteIcon } from "@components/icons";

import { cn } from "@utils/cn";

import type { Bill } from "@/types";

import {
  billTitle,
  formatTimelineDate,
  isBillPaid,
  resolveBillStatus,
  sortBillsByDue,
} from "./billHelpers";

export interface BillsTimelineProps {
  bills: Bill[];
  formatCurrency: (n: number) => string;
  onSelect?: (bill: Bill) => void;
  className?: string;
}

function dotClass(bill: Bill): string {
  if (isBillPaid(bill)) return "bg-tertiary";
  if (resolveBillStatus(bill) === "overdue") return "bg-expense";
  return "bg-sky-400";
}

function dateClass(bill: Bill): string {
  if (resolveBillStatus(bill) === "overdue" && !isBillPaid(bill)) {
    return "text-expense";
  }
  return "text-gray-500";
}

export function BillsTimeline({
  bills,
  formatCurrency,
  onSelect,
  className,
}: BillsTimelineProps) {
  const items = sortBillsByDue(bills).slice(0, 12);

  return (
    <aside
      className={cn(
        "hidden h-fit rounded-2xl border border-white/60 bg-white/90 p-5 shadow-card lg:block",
        className,
      )}
    >
      <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-brand-deep">
        <EventNoteIcon className="h-5 w-5 text-primary-main" />
        {UI_TEXT.BILLS_TIMELINE}
      </h3>

      {items.length === 0 ? (
        <EmptyState title={UI_TEXT.NO_BILL_REMINDERS} />
      ) : (
        <div className="relative space-y-5 border-l border-surface-high pl-4">
          {items.map((bill) => {
            const overdue =
              !isBillPaid(bill) && resolveBillStatus(bill) === "overdue";
            return (
              <button
                key={bill.id}
                type="button"
                onClick={() => onSelect?.(bill)}
                className="relative block w-full text-left"
              >
                <span
                  className={cn(
                    "absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white",
                    dotClass(bill),
                  )}
                  aria-hidden
                />
                <p className={cn("mb-1 text-xs font-medium", dateClass(bill))}>
                  {formatTimelineDate(bill.dueDate, overdue)}
                </p>
                <div className="rounded-xl bg-surface-low p-3 transition-colors hover:bg-surface-container">
                  <p className="truncate text-sm font-semibold text-brand-deep">
                    {billTitle(bill)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {CURRENCY_SYMBOL}
                    {formatCurrency(bill.amount)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
