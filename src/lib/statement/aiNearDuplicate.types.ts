/** Minimal shape needed for AI near-duplicate comparison. */
export interface AiNearDuplicateCheckable {
  date: string;
  type: string;
  amount: number;
  title?: string;
  description?: string;
}

/** Optional flags stored on parsed / staging rows after the AI second pass. */
export interface AiNearDuplicateFlags {
  /** True when AI flagged this row as a likely near-duplicate — review required. */
  possibleAiDuplicate?: boolean;
  /** Short model explanation for the flag. */
  aiDuplicateReason?: string;
  /** Peer identity key (batch peer staging key or existing-ledger fingerprint). */
  aiDuplicatePeerKey?: string;
}

export interface AiNearDuplicatePair {
  a: string;
  b: string;
  reason: string;
  confidence: number;
}

export interface AiNearDuplicateModelResponse {
  pairs?: AiNearDuplicatePair[];
}

export type AiNearDuplicateSkipReason =
  | "missing_api_key"
  | "empty"
  | "error"
  | "disabled";

/** Structured meta for graceful degradation (no console spam). */
export interface AiNearDuplicateMeta {
  ran: boolean;
  skippedReason?: AiNearDuplicateSkipReason;
  /** User-safe error detail when skippedReason is "error". */
  error?: string;
  flaggedCount: number;
  batchesProcessed: number;
}

export interface FlagNearDuplicatesOptions {
  /** Capped sample of already-imported txs for cross-check. */
  existingTransactions?: AiNearDuplicateCheckable[];
  /** When false, skip the AI pass and return meta.skippedReason = disabled. */
  enabled?: boolean;
}

export interface FlagNearDuplicatesResult<T> {
  transactions: T[];
  meta: AiNearDuplicateMeta;
}
