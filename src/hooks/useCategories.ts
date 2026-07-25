import { useMemo } from "react";

import { useAppSelector } from "@store/hooks";

import { DEFAULT_CATEGORY_SEEDS } from "@/lib/categoryDefaults";
import type { TransactionType } from "@/types";

export interface CategoriesResult {
  income: string[];
  expense: string[];
  getByType: (type: TransactionType) => string[];
  colorByName: Record<string, string>;
  /** True when Firestore catalog has no usable names yet. */
  isCatalogEmpty: boolean;
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

function seedNames(type: TransactionType): string[] {
  return DEFAULT_CATEGORY_SEEDS.filter((c) => c.type === type)
    .map((c) => c.name)
    .filter(Boolean);
}

function catalogNames(
  catalog: { name: string; type: TransactionType; color: string }[],
  type: TransactionType,
): string[] {
  return catalog
    .filter((c) => c.type === type && Boolean(c.name?.trim()))
    .map((c) => c.name.trim());
}

/**
 * Firestore-backed category names, merged with names already used on transactions.
 * Always falls back to default seed names per type so pickers never show empty.
 */
export function useCategories(): CategoriesResult {
  const catalog = useAppSelector((state) => state.categories.items);
  const transactions = useAppSelector((state) => state.transactions.items);

  return useMemo(() => {
    const incomeFromCatalog = catalogNames(catalog, "income");
    const expenseFromCatalog = catalogNames(catalog, "expense");
    const isCatalogEmpty =
      incomeFromCatalog.length === 0 && expenseFromCatalog.length === 0;

    const colorByName: Record<string, string> = {};
    catalog.forEach((c) => {
      if (c.name?.trim()) colorByName[c.name.trim().toLowerCase()] = c.color;
    });
    DEFAULT_CATEGORY_SEEDS.forEach((c) => {
      const key = c.name.toLowerCase();
      if (!colorByName[key]) colorByName[key] = c.color;
    });

    const txIncome: string[] = [];
    const txExpense: string[] = [];
    transactions.forEach((t) => {
      if (!t.category?.trim()) return;
      if (t.type === "income") txIncome.push(t.category);
      else txExpense.push(t.category);
    });

    // Per-type fallback: if expense catalog is empty, still show expense seeds
    // (and vice versa) even when the other type already has Firestore docs.
    const incomeBase =
      incomeFromCatalog.length > 0 ? incomeFromCatalog : seedNames("income");
    const expenseBase =
      expenseFromCatalog.length > 0 ? expenseFromCatalog : seedNames("expense");

    const income = mergeUnique(incomeBase, txIncome).sort((a, b) =>
      a.localeCompare(b),
    );
    const expense = mergeUnique(expenseBase, txExpense).sort((a, b) =>
      a.localeCompare(b),
    );

    return {
      income,
      expense,
      getByType: (type: TransactionType) =>
        type === "income" ? income : expense,
      colorByName,
      isCatalogEmpty,
    };
  }, [catalog, transactions]);
}
