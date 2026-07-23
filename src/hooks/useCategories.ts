import { useMemo } from "react";

import {
  INCOME_CATEGORIES,
  INVESTMENT_CATEGORIES,
  SORTED_EXPENSE_CATEGORIES,
} from "@constants";

import { useAppSelector } from "@store/hooks";

import type { TransactionType } from "@/types";

const BASE_INCOME = Object.values(INCOME_CATEGORIES) as string[];
const BASE_EXPENSE = [
  ...new Set([
    ...(SORTED_EXPENSE_CATEGORIES as string[]),
    ...(Object.values(INVESTMENT_CATEGORIES) as string[]),
  ]),
].sort((a, b) => a.localeCompare(b));

export interface CategoriesResult {
  income: string[];
  expense: string[];
  getByType: (type: TransactionType) => string[];
}

function mergeUnique(base: string[], extra: string[]): string[] {
  const seen = new Set(base.map((c) => c.toLowerCase()));
  const merged = [...base];
  extra.forEach((c) => {
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      merged.push(c);
    }
  });
  return merged;
}

/**
 * Single source of categories: built-in constants merged with any user-added
 * categories stored in the ui slice and categories seen in transactions.
 */
export function useCategories(): CategoriesResult {
  const userCategories = useAppSelector((state) => state.ui.categories);
  const transactions = useAppSelector((state) => state.transactions.items);

  return useMemo(() => {
    const txIncome: string[] = [];
    const txExpense: string[] = [];
    transactions.forEach((t) => {
      if (!t.category) return;
      if (t.type === "income") txIncome.push(t.category);
      else txExpense.push(t.category);
    });

    const income = mergeUnique(BASE_INCOME, [
      ...(userCategories.income ?? []),
      ...txIncome,
    ]);
    const expense = mergeUnique(BASE_EXPENSE, [
      ...(userCategories.expense ?? []),
      ...txExpense,
    ]);

    return {
      income,
      expense,
      getByType: (type: TransactionType) => (type === "income" ? income : expense),
    };
  }, [userCategories, transactions]);
}
