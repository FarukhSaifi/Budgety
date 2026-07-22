import type { Transaction } from "@types";

/**
 * Filters transactions based on search query
 * Searches in: description, category, mode, and amount
 */
export const filterTransactionsBySearch = (
  transactions: Transaction[],
  searchQuery: string | null | undefined,
): Transaction[] => {
  if (!searchQuery || searchQuery.trim() === "") {
    return transactions;
  }

  const query = searchQuery.toLowerCase().trim();

  return transactions.filter((transaction) => {
    const title = (transaction.title || transaction.description || "").toLowerCase();
    if (title.includes(query)) return true;

    const category = (transaction.category || "").toLowerCase();
    if (category.includes(query)) return true;

    const mode = (transaction.paymentMode || transaction.mode || "").toLowerCase();
    if (mode.includes(query)) return true;

    const amount = String(transaction.amount || 0);
    if (amount.includes(query)) return true;

    const formattedAmount = amount.replace(/[₹,]/g, "");
    if (formattedAmount.includes(query)) return true;

    return false;
  });
};
