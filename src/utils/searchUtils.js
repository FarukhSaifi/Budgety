/**
 * Filters transactions based on search query
 * Searches in: description, category, mode, and amount
 * @param {Array} transactions - Array of transactions to filter
 * @param {string} searchQuery - Search query string
 * @returns {Array} - Filtered transactions
 */
export const filterTransactionsBySearch = (transactions, searchQuery) => {
  if (!searchQuery || searchQuery.trim() === "") {
    return transactions;
  }

  const query = searchQuery.toLowerCase().trim();

  return transactions.filter((transaction) => {
    // Search in description
    const description = (transaction.description || "").toLowerCase();
    if (description.includes(query)) return true;

    // Search in category
    const category = (transaction.category || "").toLowerCase();
    if (category.includes(query)) return true;

    // Search in mode
    const mode = (transaction.mode || "").toLowerCase();
    if (mode.includes(query)) return true;

    // Search in amount (as string)
    const amount = String(transaction.amount || 0);
    if (amount.includes(query)) return true;

    // Search in formatted amount (remove currency symbol and commas)
    const formattedAmount = amount.replace(/[₹,]/g, "");
    if (formattedAmount.includes(query)) return true;

    return false;
  });
};

