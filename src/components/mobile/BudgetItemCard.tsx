"use client";

import type { ReactNode } from "react";

import { CURRENCY_SYMBOL } from "@constants";

import { MoreHorizIcon } from "@components/icons";

import { cn } from "@utils/cn";

export interface BudgetItemCardProps {
  category: string;
  spent: number;
  limit: number;
  formatCurrency: (n: number) => string;
  color?: string;
  icon?: ReactNode;
  onMenu?: () => void;
  className?: string;
}

export function BudgetItemCard({
  category,
  spent,
  limit,
  formatCurrency,
  color = "#4A6CFF",
  icon,
  onMenu,
  className,
}: BudgetItemCardProps) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  return (
    <div
      className={cn(
        "rounded-card border border-gray-100 bg-white p-4 shadow-card",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {icon ?? category.slice(0, 2).toUpperCase()}
          </span>
          <p className="text-sm font-semibold text-brand-deep">{category}</p>
        </div>
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
            aria-label="More"
          >
            <MoreHorizIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {CURRENCY_SYMBOL}
          {formatCurrency(spent)} / {CURRENCY_SYMBOL}
          {formatCurrency(limit)}
        </span>
        <span className="font-semibold text-brand-deep">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
