import { NUMBER_FORMAT } from "@constants";

import {
  IMPORT_FILE_STATUS,
  IMPORT_JOB_STATUS,
  IMPORT_RECORD_STATUS,
  IMPORT_STREAM,
} from "@constants/importStream";

import { chunkArray } from "@utils/chunkArray";
import { nowISO } from "@utils/dateUtils";
import {
  countRecordsByStatus,
  evaluateJobCompletion,
  finalizeJobStatus,
  getRetryableRows,
  recomputeTotalBatches,
  syncFileStatuses,
  writeImportStreamJob,
} from "@utils/importStreamJob";

import type { Transaction } from "@/types";

import type {
  ImportStreamJob,
  ImportStreamProgress,
  ImportStreamRowPayload,
  ImportStreamRunResult,
} from "./importStream.types";

export type ImportStreamCommitBatch = (items: Transaction[]) => Promise<Transaction[]>;

export interface ImportStreamRunnerOptions {
  commitBatch: ImportStreamCommitBatch;
  onProgress?: (progress: ImportStreamProgress, job: ImportStreamJob) => void;
  /** When false, skip auto-persist (tests). Default true. */
  persist?: boolean;
}

function payloadToTransaction(row: ImportStreamRowPayload, userId: string, createdAt: string): Transaction {
  return {
    id: row.key,
    userId,
    title: row.title,
    description: row.title,
    amount: Number(Number(row.amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
    type: row.type,
    category: row.category,
    paymentMode: row.paymentMode,
    mode: row.paymentMode,
    date: row.date,
    isRecurring: false,
    createdAt,
    imported: true,
  };
}

function markRecords(
  job: ImportStreamJob,
  keys: string[],
  status: (typeof IMPORT_RECORD_STATUS)[keyof typeof IMPORT_RECORD_STATUS],
  reason?: string,
): ImportStreamJob {
  const records = { ...job.records };
  for (const key of keys) {
    const prev = records[key];
    if (!prev) continue;
    records[key] = {
      ...prev,
      status,
      reason: status === IMPORT_RECORD_STATUS.IMPORTED ? undefined : reason || prev.reason,
    };
  }
  return { ...job, records };
}

function markFilesImporting(job: ImportStreamJob, fileIds: Set<string>): ImportStreamJob {
  const files = job.files.map((file) =>
    fileIds.has(file.id) &&
    (file.status === IMPORT_FILE_STATUS.PENDING ||
      file.status === IMPORT_FILE_STATUS.FAILED ||
      file.status === IMPORT_FILE_STATUS.IMPORTING)
      ? { ...file, status: IMPORT_FILE_STATUS.IMPORTING }
      : file,
  );
  return { ...job, files };
}

function persist(userId: string, job: ImportStreamJob, enabled: boolean): boolean {
  if (!enabled) return true;
  return writeImportStreamJob(userId, job);
}

function markPersistFailure(job: ImportStreamJob): ImportStreamJob {
  return {
    ...syncFileStatuses(job),
    status: IMPORT_JOB_STATUS.INTERRUPTED,
    lastError: IMPORT_STREAM.PERSIST_FAILED_REASON,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Stream pending/failed rows in Firestore-safe batches with continuous progress.
 * Atomic per batch: success → all records imported; failure → all batch records failed (flagged).
 * Persists after each batch so interrupt resume continues from the next pending batch.
 */
export async function runImportStream(
  initialJob: ImportStreamJob,
  options: ImportStreamRunnerOptions,
): Promise<ImportStreamRunResult> {
  const persistEnabled = options.persist !== false;
  let job: ImportStreamJob = {
    ...initialJob,
    status: IMPORT_JOB_STATUS.STREAMING,
    lastError: undefined,
    updatedAt: new Date().toISOString(),
  };
  job.totalBatches = recomputeTotalBatches(job);
  job = syncFileStatuses(job);
  if (!persist(job.userId, job, persistEnabled)) {
    job = markPersistFailure(job);
    // Best-effort write of the failure marker; ignore a second quota miss.
    persist(job.userId, job, persistEnabled);
    options.onProgress?.(countRecordsByStatus(job), job);
    return { job, savedIds: [...job.importedTxIds], fullySuccessful: false };
  }

  const createdAt = nowISO();
  const savedIds: string[] = [...job.importedTxIds];
  let batchCursor = 0;

  const emitProgress = () => {
    options.onProgress?.(countRecordsByStatus(job), job);
  };
  emitProgress();

  while (true) {
    const retryable = getRetryableRows(job);
    if (retryable.length === 0) break;

    const remainingChunks = chunkArray(retryable, job.batchSize || IMPORT_STREAM.BATCH_SIZE);
    const chunk = remainingChunks[0];
    if (!chunk?.length) break;

    const batchNumber = job.completedBatches + 1;
    job = {
      ...job,
      nextBatchIndex: batchNumber,
      totalBatches: job.completedBatches + remainingChunks.length,
      status: IMPORT_JOB_STATUS.STREAMING,
      updatedAt: new Date().toISOString(),
    };

    const fileIds = new Set(chunk.map((row) => row.sourceFileId));
    job = markFilesImporting(job, fileIds);
    if (!persist(job.userId, job, persistEnabled)) {
      job = markPersistFailure(job);
      persist(job.userId, job, persistEnabled);
      emitProgress();
      return { job, savedIds, fullySuccessful: false };
    }
    emitProgress();

    const keys = chunk.map((row) => row.key);
    const transactions = chunk.map((row) => payloadToTransaction(row, job.userId, createdAt));

    try {
      const saved = await options.commitBatch(transactions);
      const ids = saved.map((tx) => tx.id).filter(Boolean);
      savedIds.push(...ids);

      job = markRecords(job, keys, IMPORT_RECORD_STATUS.IMPORTED);
      job = {
        ...job,
        completedBatches: job.completedBatches + 1,
        importedTxIds: savedIds,
        updatedAt: new Date().toISOString(),
      };
      job = syncFileStatuses(job);
      job.totalBatches = recomputeTotalBatches(job);
      if (!persist(job.userId, job, persistEnabled)) {
        // Firestore writes already landed — keep imported marks; warn that resume map may be stale.
        // Last batch: finalize success instead of false INTERRUPTED (which blocks staging reset).
        if (getRetryableRows(job).length === 0) {
          job = finalizeJobStatus(job);
          if (job.status === IMPORT_JOB_STATUS.COMPLETED) {
            clearOnFullSuccess(job.userId, persistEnabled);
          } else {
            job = {
              ...job,
              lastError: IMPORT_STREAM.PERSIST_FAILED_REASON,
              updatedAt: new Date().toISOString(),
            };
          }
          emitProgress();
          return {
            job,
            savedIds,
            fullySuccessful: job.status === IMPORT_JOB_STATUS.COMPLETED,
          };
        }
        job = markPersistFailure(job);
        persist(job.userId, job, persistEnabled);
        emitProgress();
        return { job, savedIds, fullySuccessful: false };
      }
      emitProgress();

      batchCursor += 1;
      if (remainingChunks.length > 1 && IMPORT_STREAM.BATCH_PAUSE_MS > 0) {
        await new Promise((r) => setTimeout(r, IMPORT_STREAM.BATCH_PAUSE_MS));
      }
    } catch {
      // Persist a stable code only — never store raw Firestore/provider message bodies.
      const reason = IMPORT_STREAM.BATCH_FAILED_REASON;

      job = markRecords(job, keys, IMPORT_RECORD_STATUS.FAILED, reason);
      job = {
        ...job,
        status: IMPORT_JOB_STATUS.FAILED,
        lastError: reason,
        updatedAt: new Date().toISOString(),
      };
      job = syncFileStatuses(job);
      if (!persist(job.userId, job, persistEnabled)) {
        // Keep FAILED + flagged rows; surface that resume map may be stale.
        job = {
          ...job,
          lastError: IMPORT_STREAM.PERSIST_FAILED_REASON,
          updatedAt: new Date().toISOString(),
        };
      }
      emitProgress();

      return { job, savedIds, fullySuccessful: false };
    }

    // Safety: avoid infinite loop if statuses fail to advance.
    if (batchCursor > IMPORT_STREAM.MAX_BATCH_ITERATIONS) break;
  }

  const gate = evaluateJobCompletion(job);
  if (!gate.canComplete) {
    job = {
      ...syncFileStatuses(job),
      status: IMPORT_JOB_STATUS.FAILED,
      lastError: `PENDING_RECORDS:${gate.pendingRecords}`,
      updatedAt: new Date().toISOString(),
    };
    if (!persist(job.userId, job, persistEnabled)) {
      job = {
        ...job,
        lastError: IMPORT_STREAM.PERSIST_FAILED_REASON,
        updatedAt: new Date().toISOString(),
      };
    }
    emitProgress();
    return { job, savedIds, fullySuccessful: false };
  }

  job = finalizeJobStatus(job);
  if (job.status === IMPORT_JOB_STATUS.COMPLETED) {
    clearOnFullSuccess(job.userId, persistEnabled);
  } else if (!persist(job.userId, job, persistEnabled)) {
    // Import accounting finished in-memory — keep completed_with_errors; only flag resume map.
    job = {
      ...job,
      lastError: IMPORT_STREAM.PERSIST_FAILED_REASON,
      updatedAt: new Date().toISOString(),
    };
  }
  emitProgress();

  return {
    job,
    savedIds,
    fullySuccessful: job.status === IMPORT_JOB_STATUS.COMPLETED,
  };
}

function clearOnFullSuccess(userId: string, persistEnabled: boolean): void {
  if (!persistEnabled) return;
  writeImportStreamJob(userId, null);
}

/** Mark job interrupted (page hide / remount) without losing inventory. */
export function interruptImportStream(job: ImportStreamJob, persistEnabled = true): ImportStreamJob {
  if (
    job.status === IMPORT_JOB_STATUS.COMPLETED ||
    job.status === IMPORT_JOB_STATUS.COMPLETED_WITH_ERRORS
  ) {
    return job;
  }
  const next = {
    ...syncFileStatuses(job),
    status: IMPORT_JOB_STATUS.INTERRUPTED,
    updatedAt: new Date().toISOString(),
  };
  if (persistEnabled) writeImportStreamJob(job.userId, next);
  return next;
}
