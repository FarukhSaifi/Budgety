import { useMemo } from "react";

import { useAppSelector } from "@store/hooks";

import type { TransactionType } from "@/types";

export interface CategoriesResult {
  income: string[];
  expense: string[];
  getByType: (type: TransactionType) => string[];
  colorByName: Record<string, string>;
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
 * Single source of categories: Firestore-backed catalog (categoriesSlice),
 * merged with any category names already present on transactions.
 */
export function useCategories(): CategoriesResult {
  const catalog = useAppSelector((state) => state.categories.items);
  const transactions = useAppSelector((state) => state.transactions.items);

  return useMemo(() => {
    const incomeFromCatalog = catalog
      .filter((c) => c.type === "income")
      .map((c) => c.name);
    const expenseFromCatalog = catalog
      .filter((c) => c.type === "expense")
      .map((c) => c.name);

    const colorByName: Record<string, string> = {};
    catalog.forEach((c) => {
      colorByName[c.name.toLowerCase()] = c.color;
    });

    const txIncome: string[] = [];
    const txExpense: string[] = [];
    transactions.forEach((t) => {
      if (!t.category) return;
      if (t.type === "income") txIncome.push(t.category);
      else txExpense.push(t.category);
    });

    const income = mergeUnique(incomeFromCatalog, txIncome).sort((a, b) =>
      a.localeCompare(b),
    );
    const expense = mergeUnique(expenseFromCatalog, txExpense).sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      income,
      expense,
      getByType: (type: TransactionType) => (type === "income" ? income : expense),
      colorByName,
    };
  }, [catalog, transactions]);
}
