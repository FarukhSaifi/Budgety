import type { PaymentMode, Transaction, TransactionType } from "@/types";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  TRANSACTION_MODES as TX_MODES,
} from "@constants";
import { toStorageDate } from "@hooks/useDateFormatter";
import {
  detectTransactionMode,
  detectTransactionType,
  normalizeMode,
  parseAmount,
  type ColumnMapping,
  type ParsedRawRow,
} from "@utils/bankStatementParser";
import { nowISO } from "@utils/dateUtils";
import type { DuplicateCheckable } from "@utils/duplicateDetection";
import { categorizeTransaction } from "@utils/transactionCategorization";

export interface StagingRow {
  key: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  selected: boolean;
}

export function validateColumnMapping(mapping: ColumnMapping): {
  valid: boolean;
  missingColumns?: string[];
} {
  const hasDate = mapping.date >= 0;
  const hasDescription = mapping.description >= 0;
  const hasAmount = mapping.amount >= 0 || mapping.deposits >= 0 || mapping.withdraw >= 0;

  if (hasDate && hasDescription && hasAmount) {
    return { valid: true };
  }

  const missingColumns: string[] = [];
  if (!hasDate) missingColumns.push("Date");
  if (!hasDescription) missingColumns.push("Description/Narration");
  if (!hasAmount) missingColumns.push("Amount/Deposits/Withdrawals");

  return { valid: false, missingColumns };
}

export function prepareRowForDuplicateCheck(
  row: ParsedRawRow | StagingRow | DuplicateCheckable,
): DuplicateCheckable | null {
  if ("title" in row && typeof row.amount === "number" && row.date) {
    const amount = Number(row.amount);
    if (!amount) return null;
    const date =
      "date" in row && /^\d{4}-\d{2}-\d{2}/.test(String(row.date))
        ? String(row.date).slice(0, 10)
        : toStorageDate(String(row.date));
    if (!date) return null;
    return {
      date,
      description:
        "title" in row ? String((row as StagingRow).title) : String((row as DuplicateCheckable).description ?? ""),
      amount: Number(amount.toFixed(2)),
      type: row.type as TransactionType,
    };
  }

  const raw = row as ParsedRawRow;
  const dateStr = raw.date || "";
  const description = raw.description || "";
  const amountStr = raw.amount || "";
  const typeField = raw.type || "";

  const storageDate = toStorageDate(dateStr);
  if (!storageDate) return null;

  const numericAmount = parseAmount(amountStr);
  if (numericAmount === 0) return null;

  const type = detectTransactionType(amountStr, typeField) as TransactionType;
  return {
    date: storageDate,
    description: description.trim(),
    amount: Number(numericAmount.toFixed(2)),
    type,
  };
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function rawRowsToStaging(rows: ParsedRawRow[]): StagingRow[] {
  const result: StagingRow[] = [];

  for (const row of rows) {
    const dateStr = row.date || "";
    const description = (row.description || "").trim();
    const amountStr = row.amount || "";
    const typeField = row.type || "";
    const modeValue = row.mode || "";

    const storageDate = toStorageDate(dateStr);
    const numericAmount = parseAmount(amountStr);
    if (!storageDate || !description || numericAmount === 0) continue;

    const type = detectTransactionType(amountStr, typeField) as TransactionType;
    let mode = normalizeMode(modeValue) || detectTransactionMode(description);
    if (!mode) mode = TX_MODES.OTHER;

    const category = categorizeTransaction(description, type);
    const isValidCategory =
      type === TRANSACTION_TYPES.INCOME
        ? Object.values(INCOME_CATEGORIES).includes(category)
        : Object.values(EXPENSE_CATEGORIES).includes(category);
    const finalCategory = isValidCategory
      ? category
      : type === TRANSACTION_TYPES.INCOME
        ? INCOME_CATEGORIES.OTHER
        : EXPENSE_CATEGORIES.OTHER;

    result.push({
      key: newId(),
      title: description,
      amount: Number(numericAmount.toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      type,
      category: finalCategory,
      paymentMode: mode as PaymentMode,
      date: storageDate,
      selected: true,
    });
  }

  return result;
}

export interface SkipReasons {
  missingFields: number;
  invalidDate: number;
  zeroAmount: number;
}

export function prepareTransactionsForImport(
  allParsedData: ParsedRawRow[],
  editedCategories: Record<number, string>,
): { preparedTransactions: Transaction[]; skipReasons: SkipReasons } {
  const preparedTransactions: Transaction[] = [];
  const skipReasons: SkipReasons = {
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

    const type = detectTransactionType(amountStr, typeField) as TransactionType;
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

    const title = description.trim();
    preparedTransactions.push({
      id: newId(),
      userId: "",
      type,
      date: storageDate,
      paymentMode: mode as PaymentMode,
      mode,
      title,
      description: title,
      category: finalCategory,
      amount: Number(numericAmount.toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      isRecurring: false,
      createdAt: nowISO(),
      imported: true,
    });
  });

  return { preparedTransactions, skipReasons };
}

/** Map approved staging rows into Firestore-ready Transaction objects. */
export function stagingToTransactions(rows: StagingRow[], userId: string): Transaction[] {
  const createdAt = nowISO();
  return rows.map((row) => {
    const title = row.title.trim();
    const date = toStorageDate(row.date) || String(row.date).slice(0, 10);
    return {
      id: newId(),
      userId,
      title,
      description: title,
      amount: Number(Number(row.amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      type: row.type,
      category: row.category,
      paymentMode: row.paymentMode,
      mode: row.paymentMode,
      date,
      isRecurring: false,
      createdAt,
      imported: true,
    };
  });
}
