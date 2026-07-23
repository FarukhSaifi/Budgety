import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  INVESTMENT_CATEGORIES,
} from "@constants";

import type { TransactionType } from "@/types";

const INCOME_LIST = Object.values(INCOME_CATEGORIES) as string[];
const EXPENSE_LIST = [
  ...new Set([
    ...Object.values(EXPENSE_CATEGORIES),
    ...Object.values(INVESTMENT_CATEGORIES),
  ]),
] as string[];

const MAX_CATEGORY_LEN = 40;

export function builtInCategoriesForType(type: TransactionType): string[] {
  return type === "income" ? INCOME_LIST : EXPENSE_LIST;
}

export function sanitizeCategoryName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&/+.-]/gi, "")
    .slice(0, MAX_CATEGORY_LEN)
    .trim();
}

/** Prefer Title Case for newly invented labels. */
export function toTitleCaseCategory(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export interface ResolveCategoryResult {
  category: string;
  /** True when the name is not in built-ins + extras (should be persisted). */
  isNew: boolean;
}

/**
 * Resolve a category label for a transaction type.
 * Prefers canonical casing from known lists; otherwise accepts a sanitized
 * custom name (AI-invented) instead of forcing "Other".
 */
export function resolveCategoryName(
  type: TransactionType,
  value: unknown,
  extras: string[] = [],
): ResolveCategoryResult {
  const raw = sanitizeCategoryName(value);
  const other =
    type === "income" ? INCOME_CATEGORIES.OTHER : EXPENSE_CATEGORIES.OTHER;

  if (!raw) {
    return { category: other, isNew: false };
  }

  const allowed = [
    ...builtInCategoriesForType(type),
    ...extras.filter(Boolean),
  ];
  const match = allowed.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (match) {
    return { category: match, isNew: false };
  }

  if (raw.toLowerCase() === other.toLowerCase()) {
    return { category: other, isNew: false };
  }

  const titled = toTitleCaseCategory(raw);
  const builtIn = builtInCategoriesForType(type);
  const isBuiltIn = builtIn.some((c) => c.toLowerCase() === titled.toLowerCase());
  return { category: titled, isNew: !isBuiltIn };
}

export interface CategoryBuckets {
  income: string[];
  expense: string[];
}

/**
 * Collect unique custom category names from typed rows (for Redux persistence).
 */
export function collectNovelCategories(
  rows: Array<{ type: TransactionType; category?: string | null }>,
  knownExtras: CategoryBuckets = { income: [], expense: [] },
): CategoryBuckets {
  const income: string[] = [];
  const expense: string[] = [];
  const seenIncome = new Set(
    [...INCOME_LIST, ...(knownExtras.income ?? [])].map((c) => c.toLowerCase()),
  );
  const seenExpense = new Set(
    [...EXPENSE_LIST, ...(knownExtras.expense ?? [])].map((c) =>
      c.toLowerCase(),
    ),
  );

  for (const row of rows) {
    const name = sanitizeCategoryName(row.category);
    if (!name) continue;
    const other =
      row.type === "income"
        ? INCOME_CATEGORIES.OTHER
        : EXPENSE_CATEGORIES.OTHER;
    if (name.toLowerCase() === other.toLowerCase()) continue;

    if (row.type === "income") {
      if (seenIncome.has(name.toLowerCase())) continue;
      seenIncome.add(name.toLowerCase());
      income.push(toTitleCaseCategory(name));
    } else {
      if (seenExpense.has(name.toLowerCase())) continue;
      seenExpense.add(name.toLowerCase());
      expense.push(toTitleCaseCategory(name));
    }
  }

  return { income, expense };
}
