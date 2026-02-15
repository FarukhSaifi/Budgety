/**
 * Auto-categorize transactions by description keywords.
 */
import {
  CATEGORY_PATTERNS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_TYPES,
} from "@constants";

/**
 * Get category for a transaction based on description and type.
 * @param {string} description - Transaction description
 * @param {string} transactionType - TRANSACTION_TYPES.INCOME | TRANSACTION_TYPES.EXPENSE
 * @returns {string} Category key from INCOME_CATEGORIES or EXPENSE_CATEGORIES
 */
export function categorizeTransaction(description, transactionType) {
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
