import { applyCategorizationRules } from "@utils/applyCategorizationRules";

import type { CategorizationRule, Transaction } from "@/types";

export type RuleTransactionPatch = {
  id: string;
  patch: Partial<Pick<Transaction, "category" | "paymentMode" | "mode">>;
};

/**
 * Build Firestore patches for transactions that match active smart rules.
 * Only includes fields that actually change.
 */
export function buildRulePatchesForTransactions(
  transactions: Transaction[],
  rules: CategorizationRule[],
): RuleTransactionPatch[] {
  const active = rules.filter((r) => r.isActive !== false);
  if (active.length === 0 || transactions.length === 0) return [];

  const patches: RuleTransactionPatch[] = [];

  for (const tx of transactions) {
    const title = tx.title || tx.description || "";
    const hit = applyCategorizationRules(title, tx.type, active);
    if (!hit) continue;

    const patch: RuleTransactionPatch["patch"] = {};
    if (hit.category && hit.category !== tx.category) {
      patch.category = hit.category;
    }
    if (hit.paymentMode && hit.paymentMode !== (tx.paymentMode ?? tx.mode)) {
      patch.paymentMode = hit.paymentMode;
      patch.mode = hit.paymentMode;
    }
    if (patch.category || patch.paymentMode) {
      patches.push({ id: tx.id, patch });
    }
  }

  return patches;
}
