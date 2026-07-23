/**
 * Auto-categorize transactions by known UPI payees + description keywords.
 */
import {
  CATEGORY_PATTERNS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  KNOWN_UPI_PAYEE_OVERRIDES,
  TRANSACTION_TYPES,
} from "@constants";

import type { TransactionType } from "@types";

function matchKeywordCategory(
  description: string,
  transactionType: TransactionType | string,
): string | null {
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

  return null;
}

/**
 * Resolve a hard-coded UPI payee → category override (case-insensitive).
 * Returns null when no known payee matcher hits.
 */
export function resolveKnownUpiPayeeCategory(
  description: string | null | undefined,
): string | null {
  if (!description) return null;
  const text = description.toLowerCase();

  for (const entry of KNOWN_UPI_PAYEE_OVERRIDES) {
    if (entry.matchers.some((matcher) => text.includes(matcher.toLowerCase()))) {
      return entry.category;
    }
  }

  return null;
}

/** Prompt fragment teaching models the same payee → category rules. */
export function formatKnownUpiPayeePromptRules(): string {
  const lines = KNOWN_UPI_PAYEE_OVERRIDES.map(
    (entry) =>
      `- ${entry.label} (match any of: ${entry.matchers.join(", ")}) → ${entry.category}`,
  );
  return [
    "Known personal UPI payee rules (MUST apply when the narration matches; prefer these over Other/Misc):",
    ...lines,
    '- Do NOT classify on the word "MOHAMMAD" alone — require Naim vs Sameer signals above.',
  ].join("\n");
}

/**
 * Get category for a transaction based on description and type.
 * Precedence: known UPI payee overrides → merchant/keyword rules → Other.
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

  if (transactionType !== TRANSACTION_TYPES.INCOME) {
    const payeeCategory = resolveKnownUpiPayeeCategory(description);
    if (payeeCategory) return payeeCategory;
  }

  const keywordCategory = matchKeywordCategory(description, transactionType);
  if (keywordCategory) return keywordCategory;

  return transactionType === TRANSACTION_TYPES.INCOME
    ? INCOME_CATEGORIES.OTHER
    : EXPENSE_CATEGORIES.OTHER;
}

/**
 * Force known UPI payee categories after AI/keyword suggestions.
 * Does not change income rows. Safe to run on any expense description.
 */
export function applyKnownUpiPayeeCategory(
  description: string,
  type: TransactionType | string,
  currentCategory: string,
): string {
  if (type === TRANSACTION_TYPES.INCOME) return currentCategory;

  const payeeCategory = resolveKnownUpiPayeeCategory(description);
  if (payeeCategory) return payeeCategory;

  return currentCategory;
}
