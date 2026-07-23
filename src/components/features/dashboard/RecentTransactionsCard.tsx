"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { DISPLAY_LIMITS, UI_TEXT } from "@constants";

import { APP_ROUTES } from "@constants/routes";

import { DashboardWidget } from "@components/features/dashboard/DashboardWidget";
import { TransactionListRow } from "@components/features/transactions/TransactionListRow";
import { TransactionModal } from "@components/screens/transactions/TransactionModal";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { compareByDateThenCreatedAt } from "@utils/dateUtils";

import type { Transaction } from "@/types";

export interface RecentTransactionsCardProps {
  limit?: number;
  className?: string;
}

export function RecentTransactionsCard({
  limit = DISPLAY_LIMITS.PREVIEW_ITEMS,
  className,
}: RecentTransactionsCardProps) {
  const transactions = useAppSelector((s) => s.transactions.items);
  const { formatCurrency } = useCurrencyFormatter();
  const [editing, setEditing] = useState<Transaction | null>(null);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => -compareByDateThenCreatedAt(a, b))
        .slice(0, limit),
    [transactions, limit],
  );

  return (
    <>
      <DashboardWidget
        title={UI_TEXT.RECENT_TRANSACTIONS}
        className={className}
        action={
          <Link
            href={APP_ROUTES.transactions}
            className="px-2 text-sm font-semibold text-primary-main transition-colors hover:text-primary-dark"
          >
            {UI_TEXT.VIEW_ALL}
          </Link>
        }
      >
        {recent.length === 0 ? (
          <div className="px-2 py-10 text-center md:px-3">
            <p className="text-sm text-on-surface-variant">{UI_TEXT.NO_TRANSACTIONS}</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/60">
            {recent.map((transaction) => (
              <li key={transaction.id}>
                <TransactionListRow
                  transaction={transaction}
                  formatCurrency={formatCurrency}
                  onClick={() => setEditing(transaction)}
                  variant="recent"
                />
              </li>
            ))}
          </ul>
        )}
      </DashboardWidget>

      <TransactionModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        transaction={editing}
      />
    </>
  );
}
