import type {
  IMPORT_FILE_STATUS,
  IMPORT_JOB_STATUS,
  IMPORT_RECORD_STATUS,
} from "@constants/importStream";

import type { PaymentMode, TransactionType } from "@/types";

export type ImportRecordStatus = (typeof IMPORT_RECORD_STATUS)[keyof typeof IMPORT_RECORD_STATUS];
export type ImportFileStatus = (typeof IMPORT_FILE_STATUS)[keyof typeof IMPORT_FILE_STATUS];
export type ImportJobStatus = (typeof IMPORT_JOB_STATUS)[keyof typeof IMPORT_JOB_STATUS];

/** Compact source file inventory entry for a streaming import job. */
export interface ImportStreamFileEntry {
  id: string;
  name: string;
  /** Optional Gmail / attachment identifiers for stable resume matching. */
  messageId?: string;
  attachmentId?: string;
  status: ImportFileStatus;
  reason?: string;
  rowCount: number;
}

/** Compact per-row payload persisted for resume (no Redux/Firestore extras). */
export interface ImportStreamRowPayload {
  key: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  sourceFileId: string;
}

export interface ImportStreamRecordState {
  status: ImportRecordStatus;
  sourceFileId: string;
  /** Short label for failure samples (title truncated by writer). */
  label: string;
  reason?: string;
}

export interface ImportStreamJob {
  jobId: string;
  userId: string;
  /** Fingerprint of selected row keys at job creation (detect stale jobs). */
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  batchSize: number;
  totalBatches: number;
  /** Next 0-based batch index among remaining work chunks (recomputed from pending). */
  nextBatchIndex: number;
  completedBatches: number;
  status: ImportJobStatus;
  lastError?: string;
  files: ImportStreamFileEntry[];
  /** Frozen import set (selected + explicitly skipped deselected). */
  rows: ImportStreamRowPayload[];
  /** Compact status map keyed by staging row key. */
  records: Record<string, ImportStreamRecordState>;
  importedTxIds: string[];
}

export interface ImportStreamProgress {
  completedBatches: number;
  totalBatches: number;
  importedRecords: number;
  totalRecords: number;
  failedRecords: number;
  skippedRecords: number;
  pendingRecords: number;
  percent: number;
}

export interface ImportStreamSourceMeta {
  id: string;
  name: string;
  messageId?: string;
  attachmentId?: string;
}

export interface ImportStreamRunResult {
  job: ImportStreamJob;
  savedIds: string[];
  /** True only when every record is imported or explicitly skipped (no pending/failed). */
  fullySuccessful: boolean;
}
