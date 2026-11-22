import type { ParsedStatementTransaction } from "@/lib/statement/types";

export interface PageChunk {
  index: number;
  startPage: number;
  endPage: number;
  text: string;
}

export interface TaggedTransaction extends ParsedStatementTransaction {
  /** Chunk index (0-based) for stable merge ordering. */
  _chunkIndex: number;
  /** Position within the chunk result list. */
  _orderInChunk: number;
}

export type ChunkWorkerResult =
  | { ok: true; transactions: ParsedStatementTransaction[] }
  | { ok: false; error: string };
