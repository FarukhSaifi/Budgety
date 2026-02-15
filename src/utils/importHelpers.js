/**
 * Shared helpers for bank statement import: validation, row preparation, duplicate check.
 */
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  TRANSACTION_MODES as TX_MODES,
} from "@constants";
import { toStorageDate } from "@hooks/useDateFormatter";
import { nowISO } from "@utils/dateUtils";
import {
  detectTransactionMode,
  detectTransactionType,
  normalizeMode,
  parseAmount,
} from "@utils/bankStatementParser";
import { categorizeTransaction } from "@utils/transactionCategorization";

/**
 * Validate that column mapping has required fields for import.
 * @returns {{ valid: boolean, missingColumns?: string[], errorKey?: string }}
 */
export function validateColumnMapping(mapping) {
  const hasDate = mapping.date >= 0;
  const hasDescription = mapping.description >= 0;
  const hasAmount =
    mapping.amount >= 0 || mapping.deposits >= 0 || mapping.withdraw >= 0;

  if (hasDate && hasDescription && hasAmount) {
    return { valid: true };
  }

  const missingColumns = [];
  if (!hasDate) missingColumns.push("Date");
  if (!hasDescription) missingColumns.push("Description/Narration");
  if (!hasAmount) missingColumns.push("Amount/Deposits/Withdrawals");

  return { valid: false, missingColumns };
}

/**
 * Prepare a single parsed row for duplicate check (date, description, amount, type).
 * Returns null if row is invalid.
 */
export function prepareRowForDuplicateCheck(row) {
  const dateStr = row.date || "";
  const description = row.description || "";
  const amountStr = row.amount || "";
  const typeField = row.type || "";

  const storageDate = toStorageDate(dateStr);
  if (!storageDate) return null;

  const numericAmount = parseAmount(amountStr);
  if (numericAmount === 0) return null;

  const type = detectTransactionType(amountStr, typeField);
  return {
    date: storageDate,
    description: description.trim(),
    amount: Number(numericAmount.toFixed(2)),
    type,
  };
}

/**
 * Prepare all parsed rows into full transaction objects for import.
 * @returns {{ preparedTransactions: Array, skipReasons: Object }}
 */
export function prepareTransactionsForImport(allParsedData, editedCategories) {
  const preparedTransactions = [];
  const skipReasons = {
    missingFields: 0,
    invalidDate: 0,
    zeroAmount: 0,
  };

  allParsedData.forEach((row, index) => {
    const dateStr = row.date || "";
    const description = row.description || "";
    const amountStr = row.amount || "";
    const typeField = row.type || "";
    const modeValue = row.mode || "";

    if (!dateStr || !description || !amountStr) {
      skipReasons.missingFields++;
      return;
    }

    const storageDate = toStorageDate(dateStr);
    if (!storageDate) {
      skipReasons.invalidDate++;
      return;
    }

    const numericAmount = parseAmount(amountStr);
    if (numericAmount === 0) {
      skipReasons.zeroAmount++;
      return;
    }

    const type = detectTransactionType(amountStr, typeField);
    let mode = normalizeMode(modeValue) || detectTransactionMode(description);
    if (!mode) mode = TX_MODES.OTHER;

    const editedCategory = editedCategories[index];
    const category = editedCategory ?? categorizeTransaction(description, type);
    const isValidCategory =
      type === TRANSACTION_TYPES.INCOME
        ? Object.values(INCOME_CATEGORIES).includes(category)
        : Object.values(EXPENSE_CATEGORIES).includes(category);
    const finalCategory = isValidCategory
      ? category
      : type === TRANSACTION_TYPES.INCOME
        ? INCOME_CATEGORIES.OTHER
        : EXPENSE_CATEGORIES.OTHER;

    preparedTransactions.push({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      date: storageDate,
      mode,
      description: description.trim(),
      category: finalCategory,
      amount: Number(numericAmount.toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      createdAt: nowISO(),
      imported: true,
    });
  });

  return { preparedTransactions, skipReasons };
}
