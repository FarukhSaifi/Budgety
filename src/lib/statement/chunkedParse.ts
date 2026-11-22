import { ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import { filterDuplicates } from "@utils/duplicateDetection";
import { runWithConcurrency } from "@utils/runWithConcurrency";

import { flagNearDuplicatesWithAi } from "@/lib/statement/aiNearDuplicate";
import { classifyAiParseError, parseStatementWithAi } from "@/lib/statement/aiParse";
import type {
  ChunkWorkerResult,
  PageChunk,
  TaggedTransaction,
} from "@/lib/statement/chunkedParse.types";
import { extractPdfPages, truncateForAi } from "@/lib/statement/extractText";
import type {
  ChunkedParseResult,
  ParsedStatementTransaction,
  ParsePdfStatementChunkedOptions,
} from "@/lib/statement/types";

function buildPageChunks(pages: string[], pagesPerChunk: number): PageChunk[] {
  const size = Math.max(1, pagesPerChunk);
  const chunks: PageChunk[] = [];

  for (let start = 0; start < pages.length; start += size) {
    const end = Math.min(start + size, pages.length);
    const slice = pages.slice(start, end);
    const text = truncateForAi(slice.join("\n").trim());
    chunks.push({
      index: chunks.length,
      startPage: start + 1,
      endPage: end,
      text,
    });
  }

  return chunks;
}

function chunkFailureMessage(startPage: number, endPage: number): string {
  return ERROR_MESSAGES.STATEMENT_CHUNK_FAILED.replace("{start}", String(startPage)).replace(
    "{end}",
    String(endPage),
  );
}

function sortMerged(a: TaggedTransaction, b: TaggedTransaction): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a._chunkIndex !== b._chunkIndex) return a._chunkIndex - b._chunkIndex;
  return a._orderInChunk - b._orderInChunk;
}

function stripTags(tx: TaggedTransaction): ParsedStatementTransaction {
  return {
    title: tx.title,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    paymentMode: tx.paymentMode,
    date: tx.date,
    isRecurring: tx.isRecurring,
    imported: tx.imported,
    description: tx.description,
    mode: tx.mode,
    possibleAiDuplicate: tx.possibleAiDuplicate,
    aiDuplicateReason: tx.aiDuplicateReason,
    aiDuplicatePeerKey: tx.aiDuplicatePeerKey,
  };
}

/**
 * Extract PDF pages → page-range chunks → AI parse each independently →
 * stable merge with cross-chunk dedupe.
 *
 * Password unlock happens inside page extraction; chunking runs only after decrypt succeeds.
 * One chunk failure does not abort the rest.
 */
export async function parsePdfStatementChunked(
  buffer: ArrayBuffer,
  options: ParsePdfStatementChunkedOptions = {},
): Promise<ChunkedParseResult> {
  const { pages } = await extractPdfPages(buffer, options.password);
  const chunks = buildPageChunks(pages, STATEMENT_IMPORT.PAGES_PER_CHUNK);
  const totalChunks = chunks.length;

  let processedChunks = 0;
  let chunksSucceeded = 0;
  let chunksFailed = 0;
  /** Box so concurrent workers can record the last classified AI failure without CFA wiping the type. */
  const lastAiFailure: { value: { code: string; message: string } | null } = { value: null };

  const emitProgress = () => {
    options.onProgress?.({
      processedChunks,
      totalChunks,
      chunksSucceeded,
      chunksFailed,
    });
  };

  emitProgress();

  const results = await runWithConcurrency(
    chunks,
    STATEMENT_IMPORT.CHUNK_PARSE_CONCURRENCY,
    async (chunk): Promise<ChunkWorkerResult> => {
      try {
        if (!chunk.text) {
          return { ok: true, transactions: [] };
        }
        const transactions = await parseStatementWithAi(chunk.text);
        return { ok: true, transactions };
      } catch (err) {
        const classified = classifyAiParseError(err);
        if (classified) {
          lastAiFailure.value = { code: classified.code, message: classified.message };
        }
        return { ok: false, error: chunkFailureMessage(chunk.startPage, chunk.endPage) };
      } finally {
        // Progress is approximate under concurrency; finals are recomputed below.
        processedChunks = Math.min(totalChunks, processedChunks + 1);
        emitProgress();
      }
    },
  );

  const tagged: TaggedTransaction[] = [];
  const chunkErrors: string[] = [];
  chunksSucceeded = 0;
  chunksFailed = 0;

  results.forEach((result, index) => {
    if (result.ok) {
      chunksSucceeded += 1;
      result.transactions.forEach((tx, orderInChunk) => {
        tagged.push({
          ...tx,
          _chunkIndex: index,
          _orderInChunk: orderInChunk,
        });
      });
      return;
    }
    chunksFailed += 1;
    chunkErrors.push(result.error);
  });

  processedChunks = totalChunks;
  emitProgress();

  tagged.sort(sortMerged);

  const { filtered, duplicateCount } = filterDuplicates(tagged);
  const stripped = filtered.map(stripTags);

  const runAi = options.runAiNearDuplicate !== false;
  const { transactions, meta: aiNearDuplicate } = await flagNearDuplicatesWithAi(stripped, {
    enabled: runAi,
    existingTransactions: options.existingTransactions,
  });

  const allChunksFailed =
    chunksFailed > 0 && chunksSucceeded === 0 && chunks.some((chunk) => Boolean(chunk.text));

  return {
    transactions,
    meta: {
      chunksTotal: totalChunks,
      chunksSucceeded,
      chunksFailed,
      duplicatesSkipped: duplicateCount,
      processedChunks,
      totalChunks,
      chunkErrors: chunkErrors.length ? chunkErrors : undefined,
      ...(allChunksFailed && lastAiFailure.value
        ? {
            parseFailureCode: lastAiFailure.value.code,
            parseFailureMessage: lastAiFailure.value.message,
          }
        : {}),
      aiNearDuplicate,
    },
  };
}
