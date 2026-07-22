/**
 * Auto-categorize transactions by description keywords.
 */
import {
  CATEGORY_PATTERNS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_TYPES,
} from "@constants";
import type { TransactionType } from "@types";

/**
 * Get category for a transaction based on description and type.
 */
export function categorizeTransaction(
  description: string | null | undefined,
  transactionType: TransactionType | string,
): string {
  if (!description) {
    return transactionType === TRANSACTION_TYPES.INCOME
      ? INCOME_CATEGORIES.OTHER
      : EXPENSE_CATEGORIES.OTHER;
  }

  const desc = description.toLowerCase();
  const patterns =
    transactionType === TRANSACTION_TYPES.INCOME
      ? CATEGORY_PATTERNS.INCOME
      : CATEGORY_PATTERNS.EXPENSE;

  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return category;
    }
  }

  return transactionType === TRANSACTION_TYPES.INCOME
    ? INCOME_CATEGORIES.OTHER
    : EXPENSE_CATEGORIES.OTHER;
}
