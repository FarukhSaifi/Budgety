/**
 * Duplicate Transaction Detection Utility
 * 
 * Detects duplicate transactions based on:
 * - Date
 * - Description (normalized, case-insensitive)
 * - Amount (with tolerance for floating point precision)
 * - Type (income/expense)
 */

/**
 * Normalizes a description for comparison
 * @param {string} description - Transaction description
 * @returns {string} - Normalized description
 */
const normalizeDescription = (description) => {
  if (!description) return "";
  return description.trim().toLowerCase().replace(/\s+/g, " ");
};

/**
 * Compares two amounts with tolerance for floating point precision
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @param {number} tolerance - Tolerance in absolute value (default: 0.01)
 * @returns {boolean} - True if amounts are considered equal
 */
const amountsEqual = (amount1, amount2, tolerance = 0.01) => {
  return Math.abs(amount1 - amount2) < tolerance;
};

/**
 * Checks if two transactions are duplicates
 * @param {Object} transaction1 - First transaction
 * @param {Object} transaction2 - Second transaction
 * @returns {boolean} - True if transactions are duplicates
 */
export const isDuplicateTransaction = (transaction1, transaction2) => {
  if (!transaction1 || !transaction2) return false;

  // Check date (must match exactly)
  if (transaction1.date !== transaction2.date) {
    return false;
  }

  // Check type (must match)
  if (transaction1.type !== transaction2.type) {
    return false;
  }

  // Check amount (with tolerance)
  if (!amountsEqual(transaction1.amount, transaction2.amount)) {
    return false;
  }

  // Check description (normalized, case-insensitive)
  const desc1 = normalizeDescription(transaction1.description);
  const desc2 = normalizeDescription(transaction2.description);

  if (desc1 !== desc2) {
    return false;
  }

  return true;
};

/**
 * Checks if a transaction already exists in a list of transactions
 * @param {Object} newTransaction - Transaction to check
 * @param {Array<Object>} existingTransactions - Array of existing transactions
 * @returns {boolean} - True if duplicate exists
 */
export const hasDuplicate = (newTransaction, existingTransactions) => {
  if (!newTransaction || !existingTransactions || existingTransactions.length === 0) {
    return false;
  }

  return existingTransactions.some((existing) =>
    isDuplicateTransaction(newTransaction, existing)
  );
};

/**
 * Finds duplicate transactions in a list
 * @param {Array<Object>} transactions - Array of transactions to check
 * @returns {Array<{transaction: Object, duplicates: Array<Object>}>} - Array of duplicates found
 */
export const findDuplicates = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const duplicates = [];
  const processed = new Set();

  for (let i = 0; i < transactions.length; i++) {
    if (processed.has(i)) continue;

    const transaction = transactions[i];
    const duplicateGroup = [transaction];
    const duplicateIndices = [i];

    for (let j = i + 1; j < transactions.length; j++) {
      if (processed.has(j)) continue;

      if (isDuplicateTransaction(transaction, transactions[j])) {
        duplicateGroup.push(transactions[j]);
        duplicateIndices.push(j);
        processed.add(j);
      }
    }

    if (duplicateGroup.length > 1) {
      duplicates.push({
        transaction,
        duplicates: duplicateGroup.slice(1),
        indices: duplicateIndices,
      });
      processed.add(i);
    }
  }

  return duplicates;
};

/**
 * Filters out duplicate transactions from an array
 * @param {Array<Object>} transactions - Array of transactions
 * @param {Array<Object>} existingTransactions - Array of existing transactions to check against
 * @returns {Object} - Object with filtered transactions and duplicate count
 */
export const filterDuplicates = (transactions, existingTransactions = []) => {
  if (!transactions || transactions.length === 0) {
    return {
      filtered: [],
      duplicates: [],
      duplicateCount: 0,
    };
  }

  const filtered = [];
  const duplicates = [];
  const existingSet = new Set();

  // Create a set of existing transactions for faster lookup
  existingTransactions.forEach((txn) => {
    const key = `${txn.date}|${txn.type}|${normalizeDescription(txn.description)}|${txn.amount.toFixed(2)}`;
    existingSet.add(key);
  });

  // Track seen transactions in the new batch
  const seenInBatch = new Set();

  transactions.forEach((transaction, index) => {
    const key = `${transaction.date}|${transaction.type}|${normalizeDescription(transaction.description)}|${transaction.amount.toFixed(2)}`;

    // Check if duplicate exists in existing transactions
    if (existingSet.has(key)) {
      duplicates.push({
        transaction,
        index,
        reason: "exists_in_database",
      });
      return;
    }

    // Check if duplicate exists in current batch
    if (seenInBatch.has(key)) {
      duplicates.push({
        transaction,
        index,
        reason: "duplicate_in_batch",
      });
      return;
    }

    seenInBatch.add(key);
    filtered.push(transaction);
  });

  return {
    filtered,
    duplicates,
    duplicateCount: duplicates.length,
  };
};

