import type { Transaction } from "@types";

/** Pre-normalized searchable fields for one transaction. */
export interface SearchCorpusEntry {
  id: string;
  /** Lowercased concatenation of title, category, mode, and amount forms. */
  haystack: string;
}

function normalizeAmountTokens(amount: number | null | undefined): string {
  const raw = String(amount ?? 0);
  const noGrouping = raw.replace(/[₹,\s]/g, "");
  const asFixed = Number.isFinite(Number(amount))
    ? Number(amount).toFixed(2).replace(/\.?0+$/, "")
    : noGrouping;
  return `${raw} ${noGrouping} ${asFixed}`.toLowerCase();
}

/** Build a memoizable search corpus so filtering avoids re-normalizing strings. */
export function buildSearchCorpus(transactions: Transaction[]): SearchCorpusEntry[] {
  return transactions.map((transaction) => {
    const title = (transaction.title || transaction.description || "").toLowerCase();
    const category = (transaction.category || "").toLowerCase();
    const mode = (transaction.paymentMode || transaction.mode || "").toLowerCase();
    const date = String(transaction.date ?? "").toLowerCase();
    const amount = normalizeAmountTokens(transaction.amount);
    return {
      id: transaction.id,
      haystack: `${title} ${category} ${mode} ${date} ${amount}`,
    };
  });
}

/**
 * Filters transactions based on search query.
 * Searches in: description/title, category, mode, and amount.
 */
export const filterTransactionsBySearch = (
  transactions: Transaction[],
  searchQuery: string | null | undefined,
): Transaction[] => {
  if (!searchQuery || searchQuery.trim() === "") {
    return transactions;
  }

  const corpus = buildSearchCorpus(transactions);
  return filterTransactionsBySearchCorpus(transactions, corpus, searchQuery);
};

/**
 * Filter using a prebuilt corpus (O(n) scan of haystacks, no per-keystroke string work).
 */
export function filterTransactionsBySearchCorpus(
  transactions: Transaction[],
  corpus: SearchCorpusEntry[],
  searchQuery: string | null | undefined,
): Transaction[] {
  if (!searchQuery || searchQuery.trim() === "") {
    return transactions;
  }

  const query = searchQuery.toLowerCase().trim();
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const matched: Transaction[] = [];

  for (const entry of corpus) {
    if (!entry.haystack.includes(query)) continue;
    const tx = byId.get(entry.id);
    if (tx) matched.push(tx);
  }

  return matched;
}
