import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@constants";

import { applyCategorizationRules } from "@utils/applyCategorizationRules";
import { collectNovelCategories, type CategoryBuckets } from "@utils/categoryNormalize";
import type { StagingRow } from "@utils/importHelpers";
import { requestCategorySuggestion } from "@utils/suggestCategoryClient";
import { applyKnownUpiPayeeCategory } from "@utils/transactionCategorization";

import type { CategorizationRule } from "@/types";

const OTHER_INCOME = INCOME_CATEGORIES.OTHER;
const OTHER_EXPENSE = EXPENSE_CATEGORIES.OTHER;
const MAX_UNIQUE_SUGGESTS = 40;
const CONCURRENCY = 4;

function isOtherCategory(category: string, type: StagingRow["type"]): boolean {
  const other = type === "income" ? OTHER_INCOME : OTHER_EXPENSE;
  return !category || category.toLowerCase() === other.toLowerCase();
}

function applyPayeeOverrides(rows: StagingRow[]): StagingRow[] {
  return rows.map((row) => {
    const category = applyKnownUpiPayeeCategory(row.title, row.type, row.category);
    return category === row.category ? row : { ...row, category };
  });
}

/** Apply user Smart Rules after UPI overrides; before AI. */
export function applySmartRulesToStaging(rows: StagingRow[], rules: CategorizationRule[]): StagingRow[] {
  if (!rules.length) return rows;
  return rows.map((row) => {
    if (row.userOverridden) return row;
    const hit = applyCategorizationRules(row.title, row.type, rules);
    if (!hit) return row;
    return {
      ...row,
      category: hit.category || row.category,
      paymentMode: hit.paymentMode || row.paymentMode,
    };
  });
}

/**
 * For Excel/keyword staging rows stuck on "Other", ask AI for a better category
 * (may invent a new name). Known UPI payee overrides + Smart Rules win over AI.
 * Returns updated rows + novel categories to persist.
 */
export async function enrichStagingCategoriesWithAi(
  rows: StagingRow[],
  existing: CategoryBuckets = { income: [], expense: [] },
  rules: CategorizationRule[] = [],
): Promise<{ rows: StagingRow[]; discovered: CategoryBuckets }> {
  const withPayees = applySmartRulesToStaging(applyPayeeOverrides(rows), rules);
  const needsWork = withPayees.filter((r) => !r.userOverridden && isOtherCategory(r.category, r.type));
  if (needsWork.length === 0) {
    return {
      rows: withPayees,
      discovered: collectNovelCategories(withPayees, existing),
    };
  }

  const uniqueKeys = new Map<string, { title: string; type: StagingRow["type"]; amount: number }>();
  for (const row of needsWork) {
    const key = `${row.type}::${row.title.trim().toLowerCase()}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, {
        title: row.title,
        type: row.type,
        amount: row.amount,
      });
    }
    if (uniqueKeys.size >= MAX_UNIQUE_SUGGESTS) break;
  }

  const suggestions = new Map<string, string>();
  const jobs = [...uniqueKeys.entries()];

  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ([key, job]) => {
        const result = await requestCategorySuggestion({
          title: job.title,
          amount: job.amount,
          typeHint: job.type,
          existingCategories: existing,
        });
        if (result.ok && result.data.category) {
          suggestions.set(key, result.data.category);
        }
      }),
    );
  }

  const enriched = withPayees.map((row) => {
    if (row.userOverridden) return row;
    const key = `${row.type}::${row.title.trim().toLowerCase()}`;
    const suggested = suggestions.get(key);
    if (!suggested || !isOtherCategory(row.category, row.type)) return row;
    return { ...row, category: suggested };
  });

  const withRulesAgain = applySmartRulesToStaging(applyPayeeOverrides(enriched), rules);

  return {
    rows: withRulesAgain,
    discovered: collectNovelCategories(withRulesAgain, existing),
  };
}
