import { GMAIL_DEFAULTS } from "@constants";

import { parsedToStaging, type StagingRow } from "@utils/importHelpers";

import type { ParsedStatementTransaction } from "@/lib/statement/types";

import type { ReviewStagingIncoming } from "./gmailReviewQueue.types";

function storageKey(userId: string): string {
  return `${GMAIL_DEFAULTS.REVIEW_QUEUE_STORAGE_PREFIX}${userId}`;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notifyQueueChanged(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  window.dispatchEvent(
    new CustomEvent(GMAIL_DEFAULTS.REVIEW_QUEUE_CHANGED_EVENT, { detail: { userId } }),
  );
}

function isStagingRow(value: unknown): value is StagingRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.key === "string" &&
    typeof row.title === "string" &&
    typeof row.amount === "number" &&
    typeof row.type === "string" &&
    typeof row.category === "string" &&
    typeof row.paymentMode === "string" &&
    typeof row.date === "string" &&
    typeof row.selected === "boolean"
  );
}

function isParsedTransaction(value: unknown): value is ParsedStatementTransaction {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    (typeof row.title === "string" || typeof row.description === "string") &&
    (typeof row.amount === "number" || typeof row.amount === "string") &&
    typeof row.date === "string"
  );
}

/** Normalize StagingRow[] or parsed Gmail/statement txs into staging rows. */
export function normalizeReviewStaging(incoming: ReviewStagingIncoming): StagingRow[] {
  const list = incoming ?? [];
  if (list.length === 0) return [];

  if (isStagingRow(list[0])) {
    return (list as StagingRow[]).filter(isStagingRow);
  }

  if (isParsedTransaction(list[0])) {
    return parsedToStaging(list as ParsedStatementTransaction[]);
  }

  return [];
}

export function readReviewStaging(userId: string): StagingRow[] {
  if (!userId || !canUseSessionStorage()) return [];
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStagingRow);
  } catch {
    return [];
  }
}

export function writeReviewStaging(userId: string, items: StagingRow[]): void {
  if (!userId || !canUseSessionStorage()) return;
  try {
    if (items.length === 0) {
      sessionStorage.removeItem(storageKey(userId));
    } else {
      sessionStorage.setItem(storageKey(userId), JSON.stringify(items));
    }
    notifyQueueChanged(userId);
  } catch {
    notifyQueueChanged(userId);
  }
}

/**
 * Merge incoming rows into the session review queue (dedupe by staging key).
 * Accepts StagingRow[] or ParsedStatementTransaction[].
 */
export function mergeReviewStaging(userId: string, incoming: ReviewStagingIncoming): StagingRow[] {
  const nextIncoming = normalizeReviewStaging(incoming);
  if (nextIncoming.length === 0) return readReviewStaging(userId);

  const byKey = new Map<string, StagingRow>();
  for (const row of readReviewStaging(userId)) {
    byKey.set(row.key, row);
  }
  for (const row of nextIncoming) {
    byKey.set(row.key, row);
  }
  const merged = [...byKey.values()];
  writeReviewStaging(userId, merged);
  return merged;
}

/** Read and clear the review queue (one-shot handoff into Import Review). */
export function takeReviewStaging(userId: string): StagingRow[] {
  const items = readReviewStaging(userId);
  if (items.length > 0) {
    writeReviewStaging(userId, []);
  }
  return items;
}

export function clearReviewStaging(userId: string): void {
  writeReviewStaging(userId, []);
}
