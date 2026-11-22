import {
  EXPENSE_CATEGORIES,
  IMPORT_PREVIEW_SORT_KEYS,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  SORT_DIRECTIONS,
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
import { resolveCategoryName } from "@utils/categoryNormalize";
import { nowISO } from "@utils/dateUtils";
import type { DuplicateCheckable } from "@utils/duplicateDetection";
import {
  applyKnownUpiPayeeCategory,
  categorizeTransaction,
} from "@utils/transactionCategorization";

import type { ParsedStatementTransaction } from "@/lib/statement/types";
import type { PaymentMode, Transaction, TransactionType } from "@/types";

export interface StagingRow {
  key: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  selected: boolean;
  /** User edited fields in preview — skip AI/rule overwrite. */
  userOverridden?: boolean;
  /** AI second-pass near-duplicate flag — review required, not auto-dropped. */
  possibleAiDuplicate?: boolean;
  aiDuplicateReason?: string;
  aiDuplicatePeerKey?: string;
  /** Stable source file / statement / attachment id for no-miss import accounting. */
  sourceFileId?: string;
  sourceFileName?: string;
  sourceMessageId?: string;
  sourceAttachmentId?: string;
}

export type ImportPreviewSortKey = (typeof IMPORT_PREVIEW_SORT_KEYS)[keyof typeof IMPORT_PREVIEW_SORT_KEYS];

export type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

/** Whether a staging row needs user review before import. */
export function stagingRowNeedsReview(row: StagingRow, isDuplicate: boolean): boolean {
  return (
    isDuplicate ||
    Boolean(row.possibleAiDuplicate) ||
    !row.category ||
    !String(row.title || "").trim() ||
    !row.date ||
    !Number(row.amount)
  );
}

function signedAmount(row: StagingRow): number {
  const abs = Math.abs(Number(row.amount) || 0);
  return row.type === TRANSACTION_TYPES.INCOME ? abs : -abs;
}

/**
 * Stable sort of staging rows for the import review table.
 * Clones once; does not mutate the source array.
 */
export function sortStagingRows(
  rows: StagingRow[],
  sortKey: ImportPreviewSortKey,
  direction: SortDirection,
  duplicateKeys: { has: (key: string) => boolean },
): StagingRow[] {
  if (rows.length < 2) return rows;

  const dir = direction === SORT_DIRECTIONS.ASC ? 1 : -1;
  const sorted = rows.slice();

  sorted.sort((a, b) => {
    let cmp: number;

    switch (sortKey) {
      case IMPORT_PREVIEW_SORT_KEYS.DATE:
        cmp = (a.date || "").localeCompare(b.date || "");
        break;
      case IMPORT_PREVIEW_SORT_KEYS.DESCRIPTION:
        cmp = (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        });
        break;
      case IMPORT_PREVIEW_SORT_KEYS.CATEGORY:
        cmp = (a.category || "").localeCompare(b.category || "", undefined, {
          sensitivity: "base",
        });
        break;
      case IMPORT_PREVIEW_SORT_KEYS.AMOUNT:
        cmp = signedAmount(a) - signedAmount(b);
        break;
      case IMPORT_PREVIEW_SORT_KEYS.STATUS: {
        const aReview = stagingRowNeedsReview(a, duplicateKeys.has(a.key)) ? 1 : 0;
        const bReview = stagingRowNeedsReview(b, duplicateKeys.has(b.key)) ? 1 : 0;
        cmp = aReview - bReview;
        break;
      }
      default:
        cmp = 0;
    }

    if (cmp === 0) {
      cmp = a.key.localeCompare(b.key);
    }

    return cmp * dir;
  });

  return sorted;
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

/** Map AI / Gmail parsed rows into import staging rows (shared by manual + Gmail flows). */
export function parsedToStaging(rows: ParsedStatementTransaction[]): StagingRow[] {
  const staged = rows.map((row) => {
    const title = row.title || row.description || "";
    const type: TransactionType = row.type === "income" ? "income" : "expense";
    const other = type === "income" ? INCOME_CATEGORIES.OTHER : EXPENSE_CATEGORIES.OTHER;
    let category = row.category || other;
    if (!category || category.toLowerCase() === other.toLowerCase()) {
      category = categorizeTransaction(title, type);
    }
    category = applyKnownUpiPayeeCategory(title, type, category);

    let paymentMode = row.paymentMode || (TX_MODES.OTHER as PaymentMode);
    if (!paymentMode || paymentMode === TX_MODES.OTHER) {
      const detected = detectTransactionMode(title);
      if (detected && detected !== TX_MODES.OTHER) {
        paymentMode = detected as PaymentMode;
      }
    }

    const possibleAiDuplicate = Boolean(row.possibleAiDuplicate);

    return {
      key: newId(),
      title,
      amount: Number(row.amount) || 0,
      type,
      category,
      paymentMode,
      date: row.date,
      // Hard dups are unchecked later via withDuplicatesUnchecked; AI flags start unchecked.
      selected: !possibleAiDuplicate,
      possibleAiDuplicate: possibleAiDuplicate || undefined,
      aiDuplicateReason: row.aiDuplicateReason,
      aiDuplicatePeerKey: row.aiDuplicatePeerKey,
    };
  });

  // Remap batch:N peer keys (from AI pass) onto generated staging keys.
  return staged.map((row) => {
    const peer = row.aiDuplicatePeerKey;
    if (!peer?.startsWith("batch:")) return row;
    const idx = Number(peer.slice("batch:".length));
    if (!Number.isInteger(idx) || idx < 0 || idx >= staged.length) return row;
    return { ...row, aiDuplicatePeerKey: staged[idx].key };
  });
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
    const finalCategory = resolveCategoryName(type, category).category;

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
    const finalCategory = resolveCategoryName(type, category).category;

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
  const prepared: Transaction[] = [];

  for (const row of rows) {
    const date = toStorageDate(row.date);
    if (!date) continue;

    const title = row.title.trim();
    if (!title) continue;

    prepared.push({
      // Stable id = staging key so resumed stream batches are idempotent (setDoc).
      id: row.key,
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
    });
  }

  return prepared;
}
