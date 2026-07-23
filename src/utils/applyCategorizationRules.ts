import type { CategorizationRule, TransactionType } from "@/types";

/**
 * Returns the first active rule category that matches the title (case-insensitive
 * substring), or null when no rule applies.
 */
export function applyCategorizationRules(
  title: string,
  type: TransactionType,
  rules: CategorizationRule[],
): string | null {
  const haystack = String(title ?? "").toLowerCase();
  if (!haystack) return null;

  for (const rule of rules) {
    if (rule.isActive === false) continue;
    const needle = String(rule.matchContains ?? "").trim().toLowerCase();
    if (!needle || !haystack.includes(needle)) continue;
    if (
      rule.transactionType &&
      rule.transactionType !== "any" &&
      rule.transactionType !== type
    ) {
      continue;
    }
    if (rule.category) return rule.category;
  }
  return null;
}
