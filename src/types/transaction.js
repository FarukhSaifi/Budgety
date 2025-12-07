/**
 * Transaction Type Definitions
 * 
 * This file contains type definitions and schemas for transactions in the Budgety application.
 */

import { TRANSACTION_TYPES, TRANSACTION_MODES } from "@constants";

/**
 * @typedef {Object} Transaction
 * @property {string} id - Unique identifier for the transaction (UUID)
 * @property {('income'|'expense')} type - Type of transaction
 * @property {string} date - Transaction date in ISO format (YYYY-MM-DD)
 * @property {string} mode - Payment method/mode (e.g., 'Cash', 'Card', 'UPI')
 * @property {string} description - Description of the transaction
 * @property {string} category - Category of the transaction (e.g., 'Groceries', 'Salary')
 * @property {number} amount - Transaction amount (positive number)
 * @property {string} [createdAt] - ISO timestamp when transaction was created
 * @property {boolean} [imported] - Whether transaction was imported from file
 */

/**
 * Transaction type values
 * @type {Object<string, string>}
 */
export const TransactionType = {
  INCOME: TRANSACTION_TYPES.INCOME,
  EXPENSE: TRANSACTION_TYPES.EXPENSE,
};

/**
 * Transaction mode values
 * @type {Object<string, string>}
 */
export const TransactionMode = {
  CASH: TRANSACTION_MODES.CASH,
  CARD: TRANSACTION_MODES.CARD,
  UPI: TRANSACTION_MODES.UPI,
  NET_BANKING: TRANSACTION_MODES.NET_BANKING,
  CHEQUE: TRANSACTION_MODES.CHEQUE,
  BANK_TRANSFER: TRANSACTION_MODES.BANK_TRANSFER,
  WALLET: TRANSACTION_MODES.WALLET,
  NEFT: TRANSACTION_MODES.NEFT,
  IMPS: TRANSACTION_MODES.IMPS,
  RTGS: TRANSACTION_MODES.RTGS,
  OTHER: TRANSACTION_MODES.OTHER,
};

/**
 * Default transaction structure
 * @type {Transaction}
 */
export const DEFAULT_TRANSACTION = {
  id: "",
  type: TransactionType.EXPENSE,
  date: new Date().toISOString().split("T")[0],
  mode: TransactionMode.CASH,
  description: "",
  category: "",
  amount: 0,
  createdAt: new Date().toISOString(),
  imported: false,
};

/**
 * Validates a transaction object
 * @param {any} transaction - Transaction object to validate
 * @returns {boolean} - True if transaction is valid
 */
export const validateTransaction = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return false;
  }

  // Required fields
  if (!transaction.id || typeof transaction.id !== "string") {
    return false;
  }

  if (
    !transaction.type ||
    !Object.values(TransactionType).includes(transaction.type)
  ) {
    return false;
  }

  if (!transaction.date || typeof transaction.date !== "string") {
    return false;
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(transaction.date)) {
    return false;
  }

  if (!transaction.description || typeof transaction.description !== "string") {
    return false;
  }

  if (!transaction.category || typeof transaction.category !== "string") {
    return false;
  }

  if (
    typeof transaction.amount !== "number" ||
    isNaN(transaction.amount) ||
    transaction.amount < 0
  ) {
    return false;
  }

  return true;
};

/**
 * Creates a new transaction object with default values
 * @param {Partial<Transaction>} overrides - Values to override defaults
 * @returns {Transaction} - New transaction object
 * @note This function requires uuid package. Import v4 as uuid and use uuid() for id generation.
 */
export const createTransaction = (overrides = {}) => {
  // Note: In actual usage, import { v4 as uuid } from 'uuid' and use uuid() here
  const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    ...DEFAULT_TRANSACTION,
    ...overrides,
    id: overrides.id || generateId(),
    createdAt: overrides.createdAt || new Date().toISOString(),
  };
};

/**
 * Transaction filter options
 * @typedef {Object} TransactionFilter
 * @property {string} [category] - Filter by category
 * @property {string} [type] - Filter by type (income/expense)
 * @property {string} [startDate] - Start date for date range filter (YYYY-MM-DD)
 * @property {string} [endDate] - End date for date range filter (YYYY-MM-DD)
 * @property {string} [mode] - Filter by payment mode
 * @property {number} [minAmount] - Minimum amount filter
 * @property {number} [maxAmount] - Maximum amount filter
 */

/**
 * Filters transactions based on filter criteria
 * @param {Transaction[]} transactions - Array of transactions to filter
 * @param {TransactionFilter} filter - Filter criteria
 * @returns {Transaction[]} - Filtered transactions
 */
export const filterTransactions = (transactions, filter = {}) => {
  return transactions.filter((transaction) => {
    if (filter.category && transaction.category !== filter.category) {
      return false;
    }

    if (filter.type && transaction.type !== filter.type) {
      return false;
    }

    if (filter.mode && transaction.mode !== filter.mode) {
      return false;
    }

    if (filter.startDate && transaction.date < filter.startDate) {
      return false;
    }

    if (filter.endDate && transaction.date > filter.endDate) {
      return false;
    }

    if (
      filter.minAmount !== undefined &&
      transaction.amount < filter.minAmount
    ) {
      return false;
    }

    if (
      filter.maxAmount !== undefined &&
      transaction.amount > filter.maxAmount
    ) {
      return false;
    }

    return true;
  });
};

