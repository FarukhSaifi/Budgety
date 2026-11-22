import {
  IMPORT_FILE_STATUS,
  IMPORT_JOB_STATUS,
  IMPORT_RECORD_STATUS,
  IMPORT_SKIP_REASONS,
  IMPORT_STREAM,
} from "@constants/importStream";

import { toStorageDate } from "@hooks/useDateFormatter";
import { chunkArray } from "@utils/chunkArray";
import type { StagingRow } from "@utils/importHelpers";

import type {
  ImportFileStatus,
  ImportStreamFileEntry,
  ImportStreamJob,
  ImportStreamProgress,
  ImportStreamRecordState,
  ImportStreamRowPayload,
  ImportStreamSourceMeta,
} from "./importStream.types";

function storageKey(userId: string): string {
  return `${IMPORT_STREAM.STORAGE_PREFIX}${userId}`;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notifyJobChanged(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  window.dispatchEvent(
    new CustomEvent(IMPORT_STREAM.JOB_CHANGED_EVENT, { detail: { userId } }),
  );
}

function newJobId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function truncateLabel(title: string): string {
  const trimmed = title.trim();
  const max = IMPORT_STREAM.LABEL_MAX_CHARS;
  if (trimmed.length <= max) return trimmed;
  const keep = Math.max(1, max - 1);
  return `${trimmed.slice(0, keep)}…`;
}

export function buildImportFingerprint(rowKeys: string[]): string {
  return [...rowKeys].sort().join("|");
}

export function attachSourceToRows(rows: StagingRow[], source: ImportStreamSourceMeta): StagingRow[] {
  return rows.map((row) => ({
    ...row,
    sourceFileId: source.id,
    sourceFileName: source.name,
    sourceMessageId: source.messageId,
    sourceAttachmentId: source.attachmentId,
  }));
}

export function resolveRowSource(row: StagingRow): ImportStreamSourceMeta {
  if (row.sourceFileId) {
    return {
      id: row.sourceFileId,
      name: row.sourceFileName || IMPORT_STREAM.FALLBACK_FILE_NAME,
      messageId: row.sourceMessageId,
      attachmentId: row.sourceAttachmentId,
    };
  }
  return {
    id: IMPORT_STREAM.FALLBACK_FILE_ID,
    name: IMPORT_STREAM.FALLBACK_FILE_NAME,
  };
}

function toPayload(row: StagingRow, sourceFileId: string): ImportStreamRowPayload | null {
  const date = toStorageDate(row.date);
  const title = String(row.title || "").trim();
  if (!date || !title) return null;
  return {
    key: row.key,
    title,
    amount: Number(row.amount) || 0,
    type: row.type,
    category: row.category,
    paymentMode: row.paymentMode,
    date,
    sourceFileId,
  };
}

function deriveFileStatus(
  fileId: string,
  records: Record<string, ImportStreamRecordState>,
): { status: ImportFileStatus; reason?: string } {
  const related = Object.values(records).filter((r) => r.sourceFileId === fileId);
  if (related.length === 0) {
    return { status: IMPORT_FILE_STATUS.SKIPPED, reason: IMPORT_SKIP_REASONS.EMPTY_BATCH };
  }

  const hasPending = related.some((r) => r.status === IMPORT_RECORD_STATUS.PENDING);
  const hasFailed = related.some((r) => r.status === IMPORT_RECORD_STATUS.FAILED);
  const hasImported = related.some((r) => r.status === IMPORT_RECORD_STATUS.IMPORTED);
  const allSkipped = related.every((r) => r.status === IMPORT_RECORD_STATUS.SKIPPED);

  if (hasPending && hasImported) return { status: IMPORT_FILE_STATUS.IMPORTING };
  if (hasPending) return { status: IMPORT_FILE_STATUS.PENDING };
  if (hasFailed) {
    const reason = related.find((r) => r.status === IMPORT_RECORD_STATUS.FAILED)?.reason;
    return { status: IMPORT_FILE_STATUS.FAILED, reason };
  }
  if (allSkipped) {
    return {
      status: IMPORT_FILE_STATUS.SKIPPED,
      reason: related[0]?.reason || IMPORT_SKIP_REASONS.DESELECTED,
    };
  }
  return { status: IMPORT_FILE_STATUS.IMPORTED };
}

export function syncFileStatuses(job: ImportStreamJob): ImportStreamJob {
  const files = job.files.map((file) => {
    const derived = deriveFileStatus(file.id, job.records);
    return { ...file, status: derived.status, reason: derived.reason };
  });
  return { ...job, files, updatedAt: new Date().toISOString() };
}

export function countRecordsByStatus(job: ImportStreamJob): ImportStreamProgress {
  let importedRecords = 0;
  let failedRecords = 0;
  let skippedRecords = 0;
  let pendingRecords = 0;

  for (const state of Object.values(job.records)) {
    switch (state.status) {
      case IMPORT_RECORD_STATUS.IMPORTED:
        importedRecords += 1;
        break;
      case IMPORT_RECORD_STATUS.FAILED:
        failedRecords += 1;
        break;
      case IMPORT_RECORD_STATUS.SKIPPED:
        skippedRecords += 1;
        break;
      default:
        pendingRecords += 1;
    }
  }

  const totalRecords = importedRecords + failedRecords + skippedRecords + pendingRecords;
  const workTotal = Math.max(1, importedRecords + failedRecords + pendingRecords);
  const percent = Math.round(((importedRecords + failedRecords) / workTotal) * 100);

  return {
    completedBatches: job.completedBatches,
    totalBatches: Math.max(job.totalBatches, 1),
    importedRecords,
    totalRecords,
    failedRecords,
    skippedRecords,
    pendingRecords,
    percent: Math.min(100, Math.max(0, percent)),
  };
}

export function listFailedRecordSamples(job: ImportStreamJob, limit = IMPORT_STREAM.FAILED_SAMPLE_LIMIT): string[] {
  const samples: string[] = [];
  for (const state of Object.values(job.records)) {
    if (state.status !== IMPORT_RECORD_STATUS.FAILED) continue;
    samples.push(state.label);
    if (samples.length >= limit) break;
  }
  return samples;
}

export function listFailedFileNames(job: ImportStreamJob, limit = IMPORT_STREAM.FAILED_FILE_SAMPLE_LIMIT): string[] {
  return job.files
    .filter((f) => f.status === IMPORT_FILE_STATUS.FAILED)
    .slice(0, limit)
    .map((f) => f.name);
}

export function getRetryableRows(job: ImportStreamJob): ImportStreamRowPayload[] {
  return job.rows.filter((row) => {
    const status = job.records[row.key]?.status;
    return status === IMPORT_RECORD_STATUS.PENDING || status === IMPORT_RECORD_STATUS.FAILED;
  });
}

export function recomputeTotalBatches(job: ImportStreamJob, batchSize = job.batchSize): number {
  const remaining = getRetryableRows(job);
  if (remaining.length === 0) return Math.max(job.completedBatches, 1);
  return job.completedBatches + chunkArray(remaining, batchSize).length;
}

/**
 * Build a new streaming job from Review staging.
 * Selected rows → pending; deselected → skipped (explicit, never silent).
 * Invalid selected rows → failed with reason (flagged, not dropped).
 */
export function createImportStreamJob(userId: string, staging: StagingRow[]): ImportStreamJob {
  const fileMap = new Map<string, ImportStreamFileEntry>();
  const rows: ImportStreamRowPayload[] = [];
  const records: Record<string, ImportStreamRecordState> = {};
  const selectedKeys: string[] = [];

  for (const row of staging) {
    const source = resolveRowSource(row);
    const existing = fileMap.get(source.id);
    if (existing) {
      existing.rowCount += 1;
    } else {
      fileMap.set(source.id, {
        id: source.id,
        name: source.name,
        messageId: source.messageId,
        attachmentId: source.attachmentId,
        status: IMPORT_FILE_STATUS.PENDING,
        rowCount: 1,
      });
    }

    const payload = toPayload(row, source.id);
    if (!payload) {
      records[row.key] = {
        status: row.selected ? IMPORT_RECORD_STATUS.FAILED : IMPORT_RECORD_STATUS.SKIPPED,
        sourceFileId: source.id,
        label: truncateLabel(row.title || row.key),
        reason: row.selected ? IMPORT_SKIP_REASONS.INVALID_ROW : IMPORT_SKIP_REASONS.DESELECTED,
      };
      continue;
    }

    rows.push(payload);
    if (row.selected) {
      selectedKeys.push(row.key);
      records[row.key] = {
        status: IMPORT_RECORD_STATUS.PENDING,
        sourceFileId: source.id,
        label: truncateLabel(payload.title),
      };
    } else {
      records[row.key] = {
        status: IMPORT_RECORD_STATUS.SKIPPED,
        sourceFileId: source.id,
        label: truncateLabel(payload.title),
        reason: IMPORT_SKIP_REASONS.DESELECTED,
      };
    }
  }

  const pendingCount = selectedKeys.length;
  const batchSize = IMPORT_STREAM.BATCH_SIZE;
  const totalBatches = Math.max(1, chunkArray(selectedKeys, batchSize).length);
  const now = new Date().toISOString();

  const job: ImportStreamJob = {
    jobId: newJobId(),
    userId,
    fingerprint: buildImportFingerprint(selectedKeys),
    createdAt: now,
    updatedAt: now,
    batchSize,
    totalBatches: pendingCount === 0 ? 1 : totalBatches,
    nextBatchIndex: 0,
    completedBatches: 0,
    status: IMPORT_JOB_STATUS.STREAMING,
    files: [...fileMap.values()],
    rows,
    records,
    importedTxIds: [],
  };

  return syncFileStatuses(job);
}

function isJobShape(value: unknown): value is ImportStreamJob {
  if (!value || typeof value !== "object") return false;
  const job = value as ImportStreamJob;
  return (
    typeof job.jobId === "string" &&
    typeof job.userId === "string" &&
    typeof job.fingerprint === "string" &&
    Array.isArray(job.files) &&
    Array.isArray(job.rows) &&
    job.records != null &&
    typeof job.records === "object" &&
    Array.isArray(job.importedTxIds)
  );
}

export function readImportStreamJob(userId: string): ImportStreamJob | null {
  if (!userId || !canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isJobShape(parsed) || parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist job for resume. Returns false when storage is unavailable or quota write fails. */
export function writeImportStreamJob(userId: string, job: ImportStreamJob | null): boolean {
  if (!userId || !canUseSessionStorage()) return false;
  if (job && job.userId !== userId) return false;
  try {
    if (!job) {
      sessionStorage.removeItem(storageKey(userId));
    } else {
      sessionStorage.setItem(storageKey(userId), JSON.stringify(job));
    }
    notifyJobChanged(userId);
    return true;
  } catch {
    // QuotaExceeded / private mode — caller must not assume resume state is durable.
    notifyJobChanged(userId);
    return false;
  }
}

/**
 * Prefer the in-memory (or otherwise newer) job when sessionStorage lag/quota left a
 * stale resume map behind — critical after PERSIST_FAILED mid-stream.
 */
export function preferFresherImportJob(
  a: ImportStreamJob | null | undefined,
  b: ImportStreamJob | null | undefined,
): ImportStreamJob | null {
  const left = a ?? null;
  const right = b ?? null;
  if (!left) return right;
  if (!right) return left;
  if (left.jobId === right.jobId) {
    if (left.completedBatches !== right.completedBatches) {
      return left.completedBatches >= right.completedBatches ? left : right;
    }
    const leftImported = countRecordsByStatus(left).importedRecords;
    const rightImported = countRecordsByStatus(right).importedRecords;
    if (leftImported !== rightImported) {
      return leftImported >= rightImported ? left : right;
    }
    return (left.updatedAt || "") >= (right.updatedAt || "") ? left : right;
  }
  return (left.updatedAt || "") >= (right.updatedAt || "") ? left : right;
}

export function clearImportStreamJob(userId: string): void {
  writeImportStreamJob(userId, null);
}

export function markJobInterrupted(job: ImportStreamJob): ImportStreamJob {
  if (
    job.status === IMPORT_JOB_STATUS.COMPLETED ||
    job.status === IMPORT_JOB_STATUS.COMPLETED_WITH_ERRORS
  ) {
    return job;
  }
  return {
    ...syncFileStatuses(job),
    status: IMPORT_JOB_STATUS.INTERRUPTED,
    updatedAt: new Date().toISOString(),
  };
}

/** True when the job still has work (pending or failed retryable). */
export function jobHasRetryableWork(job: ImportStreamJob): boolean {
  return getRetryableRows(job).length > 0;
}

/**
 * Completion gate: every record must be imported, failed, or skipped — never pending.
 * Fully successful only when there are zero failed records.
 */
export function evaluateJobCompletion(job: ImportStreamJob): {
  canComplete: boolean;
  fullySuccessful: boolean;
  pendingRecords: number;
  failedRecords: number;
} {
  const counts = countRecordsByStatus(job);
  const canComplete = counts.pendingRecords === 0;
  const fullySuccessful = canComplete && counts.failedRecords === 0;
  return {
    canComplete,
    fullySuccessful,
    pendingRecords: counts.pendingRecords,
    failedRecords: counts.failedRecords,
  };
}

export function finalizeJobStatus(job: ImportStreamJob): ImportStreamJob {
  const { canComplete, fullySuccessful, pendingRecords } = evaluateJobCompletion(job);
  if (!canComplete) {
    return {
      ...syncFileStatuses(job),
      status: IMPORT_JOB_STATUS.FAILED,
      lastError: `PENDING_RECORDS:${pendingRecords}`,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...syncFileStatuses(job),
    status: fullySuccessful ? IMPORT_JOB_STATUS.COMPLETED : IMPORT_JOB_STATUS.COMPLETED_WITH_ERRORS,
    updatedAt: new Date().toISOString(),
    lastError: fullySuccessful ? undefined : job.lastError,
  };
}
