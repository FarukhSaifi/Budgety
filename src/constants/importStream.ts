import { FIRESTORE_QUERY } from "./firestore";

/**
 * Streaming / resumable Review → Import pipeline.
 * Batch size stays under Firestore’s 500-write limit; job state lives in sessionStorage.
 * BATCH_SIZE / BATCH_PAUSE_MS stay locked to FIRESTORE_QUERY so stream + bulk writer never diverge.
 */
export const IMPORT_STREAM = {
  /** Rows per Firestore write batch (must stay ≤ 500). */
  BATCH_SIZE: FIRESTORE_QUERY.WRITE_BATCH_CHUNK,
  /** Brief pause between successful batches (ms). */
  BATCH_PAUSE_MS: FIRESTORE_QUERY.WRITE_CHUNK_PAUSE_MS,
  STORAGE_PREFIX: "budgety.import.streamJob.",
  JOB_CHANGED_EVENT: "budgety:import-stream-changed",
  /** Synthetic file id when a row has no upload/Gmail source. */
  FALLBACK_FILE_ID: "session:review",
  FALLBACK_FILE_NAME: "Review session",
  /** Max failed record titles shown in UI summaries. */
  FAILED_SAMPLE_LIMIT: 5,
  /** Max failed file names shown in UI summaries. */
  FAILED_FILE_SAMPLE_LIMIT: 5,
  /** Max chars kept for failed-record sample labels. */
  LABEL_MAX_CHARS: 48,
  /** Hard ceiling on batch loop iterations (guards against status bugs). */
  MAX_BATCH_ITERATIONS: 10_000,
  /** Generic reason stored when a Firestore batch write fails (no provider detail). */
  BATCH_FAILED_REASON: "IMPORT_BATCH_FAILED",
  /** sessionStorage quota / write failure — resume state may be incomplete. */
  PERSIST_FAILED_REASON: "IMPORT_PERSIST_FAILED",
} as const;

export const IMPORT_RECORD_STATUS = {
  PENDING: "pending",
  IMPORTED: "imported",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const IMPORT_FILE_STATUS = {
  PENDING: "pending",
  IMPORTING: "importing",
  IMPORTED: "imported",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const IMPORT_JOB_STATUS = {
  STREAMING: "streaming",
  INTERRUPTED: "interrupted",
  FAILED: "failed",
  COMPLETED: "completed",
  COMPLETED_WITH_ERRORS: "completed_with_errors",
} as const;

export const IMPORT_SKIP_REASONS = {
  DESELECTED: "deselected_by_user",
  INVALID_ROW: "invalid_row",
  EMPTY_BATCH: "empty_after_filter",
} as const;

export const IMPORT_STREAM_UI = {
  PROGRESS:
    "Uploading batch {current} of {total} — {imported} of {rows} transactions saved",
  PROGRESS_ARIA: "Import upload progress",
  RESUMING: "Resuming interrupted import from batch {current} of {total}…",
  INTERRUPTED:
    "Import interrupted after {imported} of {rows} transactions ({batchesDone} of {batches} batches). Resume to continue — nothing pending was dropped.",
  PARTIAL_FAILURE:
    "Imported {imported} of {rows}. {failed} failed, {skipped} skipped. Failed sample: {sample}. Retry to re-attempt failed rows.",
  FILE_FAILURE_BANNER:
    "{count} file(s) need attention: {names}. Failed files are flagged — retry import to continue.",
  RECORD_FAILURE_BANNER:
    "{count} transaction(s) failed and were flagged (not dropped). Sample: {sample}",
  COMPLETE_GATE_BLOCKED:
    "Import cannot finish successfully while {pending} transaction(s) are still pending.",
  BUSY_DISCARD:
    "Import is still running. Wait for it to finish before discarding the review session.",
  PERSIST_FAILED:
    "Could not save import progress for resume (browser storage full or blocked). Keep this tab open and retry failed rows if interrupted.",
  RETRY_FAILED: "Retry failed ({count})",
  RESUME_IMPORT: "Resume import",
  FILES_SUMMARY: "Files: {imported} imported, {failed} failed, {skipped} skipped, {pending} pending",
  RECORDS_SUMMARY:
    "Transactions: {imported} imported, {failed} failed, {skipped} skipped, {pending} pending",
} as const;
