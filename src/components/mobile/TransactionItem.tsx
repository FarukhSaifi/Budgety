"use client";

import { TransactionListRow } from "@components/features/transactions/TransactionListRow";
import type { Transaction } from "@/types";

export interface TransactionItemProps {
  transaction: Transaction;
  formatCurrency: (n: number) => string;
  onClick?: () => void;
  className?: string;
}

/** Stitch transactions-feed row (circular icon tile). */
export function TransactionItem({
  transaction,
  formatCurrency,
  onClick,
  className,
}: TransactionItemProps) {
  return (
    <TransactionListRow
      transaction={transaction}
      formatCurrency={formatCurrency}
      onClick={onClick}
      variant="list"
      className={className}
    />
  );
}
