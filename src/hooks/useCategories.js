import { useBudget } from "@context/BudgetContext";
import { useMemo } from "react";

const DEFAULT_CATEGORIES = { income: [], expense: [] };

/**
 * Single source of categories from DB (via context).
 * Use this across the app instead of reading categories from useBudget() directly.
 * @returns {{ income: string[], expense: string[], getByType: (type: 'income'|'expense') => string[] }}
 */
export function useCategories() {
  const { categories = DEFAULT_CATEGORIES } = useBudget();

  return useMemo(
    () => ({
      income: categories.income || [],
      expense: categories.expense || [],
      getByType: (type) => {
        if (type === "income") return categories.income || [];
        if (type === "expense") return categories.expense || [];
        return [];
      },
    }),
    [categories.income, categories.expense],
  );
}
