import type { Transaction, TransactionType } from "@/types";

const AMOUNT_TOLERANCE = 0.01;

export interface DuplicateCheckable {
  date: string;
  type: TransactionType | string;
  amount: number;
  description?: string;
  title?: string;
}

function normalizeDescription(description: string | undefined | null): string {
  if (!description) return "";
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Normalize to YYYY-MM-DD so ISO datetimes match date-only staging rows. */
function normalizeDateKey(date: string | undefined | null): string {
  if (!date) return "";
  const raw = String(date).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return raw;
}

function getDescription(tx: DuplicateCheckable): string {
  return normalizeDescription(tx.description ?? tx.title);
}

function amountsEqual(amount1: number, amount2: number, tolerance = AMOUNT_TOLERANCE): boolean {
  return Math.abs(amount1 - amount2) < tolerance;
}

function duplicateKey(tx: DuplicateCheckable): string {
  return `${normalizeDateKey(tx.date)}|${tx.type}|${getDescription(tx)}|${Number(tx.amount).toFixed(2)}`;
}

/** True when date, type, amount (±0.01), and normalized description match. */
export function isDuplicateTransaction(
  transaction1: DuplicateCheckable | null | undefined,
  transaction2: DuplicateCheckable | null | undefined,
): boolean {
  if (!transaction1 || !transaction2) return false;
  if (normalizeDateKey(transaction1.date) !== normalizeDateKey(transaction2.date)) {
    return false;
  }
  if (transaction1.type !== transaction2.type) return false;
  if (!amountsEqual(Number(transaction1.amount), Number(transaction2.amount))) {
    return false;
  }
  return getDescription(transaction1) === getDescription(transaction2);
}

export function hasDuplicate(
  newTransaction: DuplicateCheckable,
  existingTransactions: DuplicateCheckable[] | Transaction[],
): boolean {
  if (!newTransaction || !existingTransactions?.length) return false;
  return existingTransactions.some((existing) => isDuplicateTransaction(newTransaction, existing));
}

export interface DuplicateGroup {
  transaction: DuplicateCheckable;
  duplicates: DuplicateCheckable[];
  indices: number[];
}

export function findDuplicates(transactions: DuplicateCheckable[]): DuplicateGroup[] {
  if (!transactions?.length) return [];

  const duplicates: DuplicateGroup[] = [];
  const processed = new Set<number>();

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
}

export type DuplicateReason = "exists_in_database" | "duplicate_in_batch";

export interface FilteredDuplicate {
  transaction: DuplicateCheckable;
  index: number;
  reason: DuplicateReason;
}

export interface FilterDuplicatesResult {
  filtered: DuplicateCheckable[];
  duplicates: FilteredDuplicate[];
  duplicateCount: number;
}

/**
 * Filters out rows that match existing transactions (or earlier rows in the batch)
 * by date + type + amount + normalized description/title.
 */
export function filterDuplicates<T extends DuplicateCheckable>(
  transactions: T[],
  existingTransactions: DuplicateCheckable[] = [],
): { filtered: T[]; duplicates: FilteredDuplicate[]; duplicateCount: number } {
  if (!transactions?.length) {
    return { filtered: [], duplicates: [], duplicateCount: 0 };
  }

  const filtered: T[] = [];
  const duplicates: FilteredDuplicate[] = [];
  const existingSet = new Set(existingTransactions.map(duplicateKey));
  const seenInBatch = new Set<string>();

  transactions.forEach((transaction, index) => {
    const key = duplicateKey(transaction);

    if (existingSet.has(key)) {
      duplicates.push({
        transaction,
        index,
        reason: "exists_in_database",
      });
      return;
    }

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
}
