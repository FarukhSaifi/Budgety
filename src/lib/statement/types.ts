import type { AiNearDuplicateFlags, AiNearDuplicateMeta } from "@/lib/statement/aiNearDuplicate.types";
import type { PaymentMode, TransactionType } from "@/types";

/** Transaction shape returned by `/api/parse-statement` (pre–userId/id). */
export interface ParsedStatementTransaction extends AiNearDuplicateFlags {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  isRecurring: false;
  imported: true;
  /** Legacy alias — mirrors title. */
  description?: string;
  /** Legacy alias — mirrors paymentMode. */
  mode?: string;
}

export type StatementFileKind = "csv" | "pdf";

export interface DiscoveredCategories {
  income: string[];
  expense: string[];
}

/** Matches `STATEMENT_IMPORT.PDF_PASSWORD_CODES` values. */
export type PdfPasswordErrorCode = "PDF_PASSWORD_REQUIRED" | "PDF_PASSWORD_INCORRECT";

/** Per-page plain text extracted from a PDF buffer. */
export interface ExtractedPdfPages {
  /** 1-indexed page texts (empty string when a page has no extractable text). */
  pages: string[];
  pageCount: number;
}

/** Chunk progress snapshot for long PDF imports (UI can bind later). */
export interface ChunkParseProgress {
  processedChunks: number;
  totalChunks: number;
  chunksSucceeded: number;
  chunksFailed: number;
}

/** Meta produced by the shared chunked PDF parse pipeline. */
export interface ChunkedParseMeta {
  chunksTotal: number;
  chunksSucceeded: number;
  chunksFailed: number;
  duplicatesSkipped: number;
  /** Alias of chunksTotal for progress consumers. */
  totalChunks: number;
  /** Chunks finished (success or failure). */
  processedChunks: number;
  /** User-safe per-chunk failure messages (partial import). */
  chunkErrors?: string[];
  /**
   * When every non-empty chunk failed, the best-effort AI/provider failure code
   * (e.g. AI_RATE_LIMITED) so unlock UI does not look like a wrong password.
   */
  parseFailureCode?: string;
  /** User-safe message paired with parseFailureCode. */
  parseFailureMessage?: string;
  /** AI second-pass near-duplicate meta (graceful skip when unavailable). */
  aiNearDuplicate?: AiNearDuplicateMeta;
}

export interface ChunkedParseResult {
  transactions: ParsedStatementTransaction[];
  meta: ChunkedParseMeta;
}

export interface ParsePdfStatementChunkedOptions {
  password?: string;
  onProgress?: (progress: ChunkParseProgress) => void;
  /**
   * When false, skip AI near-duplicate second pass (caller runs it later).
   * Default true.
   */
  runAiNearDuplicate?: boolean;
  /** Optional existing ledger sample for AI near-dupe cross-check. */
  existingTransactions?: Array<{
    date: string;
    type: string;
    amount: number;
    title?: string;
    description?: string;
  }>;
}

export interface ParseStatementSuccess {
  transactions: ParsedStatementTransaction[];
  meta: {
    source: StatementFileKind;
    count: number;
    /** Novel category names invented by AI (client should persist via addCategory). */
    discoveredCategories?: DiscoveredCategories;
    chunksTotal?: number;
    chunksSucceeded?: number;
    chunksFailed?: number;
    duplicatesSkipped?: number;
    processedChunks?: number;
    totalChunks?: number;
    chunkErrors?: string[];
    aiNearDuplicate?: AiNearDuplicateMeta;
  };
}

export type ParseStatementErrorCode =
  | "PDF_PASSWORD_REQUIRED"
  | "PDF_PASSWORD_INCORRECT"
  | "UNAUTHORIZED"
  | string;

export interface ParseStatementError {
  error: string;
  /** Machine-readable code for client branching (e.g. password unlock UI). */
  code?: ParseStatementErrorCode;
}
