"use client";

import { cn } from "@utils/cn";
import type { Transaction } from "@/types";
import type { ReactNode } from "react";
import { TransactionItem } from "./TransactionItem";

export interface TransactionGroupProps {
  dateLabel: string;
  dayNumber?: string;
  transactions: Transaction[];
  formatCurrency: (n: number) => string;
  onSelect?: (t: Transaction) => void;
  className?: string;
  empty?: ReactNode;
}

export function TransactionGroup({
  dateLabel,
  dayNumber,
  transactions,
  formatCurrency,
  onSelect,
  className,
  empty,
}: TransactionGroupProps) {
  if (transactions.length === 0) return empty ? <>{empty}</> : null;

  return (
    <section className={cn("space-y-1", className)}>
      <h3 className="mb-3 text-xs font-bold text-gray-400">
        {dayNumber ? (
          <>
            <span className="text-brand-deep">{dayNumber}</span> {dateLabel}
          </>
        ) : (
          dateLabel
        )}
      </h3>
      <ul className="space-y-1">
        {transactions.map((t) => (
          <li key={t.id}>
            <TransactionItem
              transaction={t}
              formatCurrency={formatCurrency}
              onClick={onSelect ? () => onSelect(t) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
