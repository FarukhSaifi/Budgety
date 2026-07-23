import type { CategorizationRule, PaymentMode, TransactionType } from "@/types";

export type RuleApplyResult = {
  category?: string;
  paymentMode?: PaymentMode;
};

function needlesForRule(rule: CategorizationRule): string[] {
  const fromList = (rule.matchContainsAny ?? [])
    .map((s) =>
      String(s ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
  if (fromList.length > 0) return fromList;
  const single = String(rule.matchContains ?? "")
    .trim()
    .toLowerCase();
  return single ? [single] : [];
}

function ruleMatchesTitle(rule: CategorizationRule, haystack: string): boolean {
  const needles = needlesForRule(rule);
  if (needles.length === 0) return false;
  return needles.some((n) => haystack.includes(n));
}

/**
 * Returns the first active rule match for the title (case-insensitive
 * substring OR over matchContainsAny / matchContains).
 */
export function applyCategorizationRules(
  title: string,
  type: TransactionType,
  rules: CategorizationRule[],
): RuleApplyResult | null {
  const haystack = String(title ?? "").toLowerCase();
  if (!haystack) return null;

  for (const rule of rules) {
    if (rule.isActive === false) continue;
    if (rule.transactionType && rule.transactionType !== "any" && rule.transactionType !== type) {
      continue;
    }
    if (!ruleMatchesTitle(rule, haystack)) continue;

    const result: RuleApplyResult = {};
    if (rule.category) result.category = rule.category;
    if (rule.paymentMode) result.paymentMode = rule.paymentMode;
    if (result.category || result.paymentMode) return result;
  }
  return null;
}

/** @deprecated Prefer applyCategorizationRules; returns category only. */
export function applyCategorizationRuleCategory(
  title: string,
  type: TransactionType,
  rules: CategorizationRule[],
): string | null {
  return applyCategorizationRules(title, type, rules)?.category ?? null;
}
