import { AI_NEAR_DUPLICATE, STATEMENT_IMPORT } from "@constants";

import { chunkArray } from "@utils/chunkArray";

import { hasGeminiApiKey } from "@/lib/ai/geminiClient";
import type {
  AiNearDuplicateCheckable,
  AiNearDuplicateFlags,
  AiNearDuplicateMeta,
  AiNearDuplicateModelResponse,
  AiNearDuplicatePair,
  FlagNearDuplicatesOptions,
  FlagNearDuplicatesResult,
} from "@/lib/statement/aiNearDuplicate.types";

function txLabel(tx: AiNearDuplicateCheckable): string {
  return String(tx.title || tx.description || "").trim().slice(0, 120);
}

/** Stable fingerprint for existing-ledger peers (not a staging key). */
export function existingPeerKey(tx: AiNearDuplicateCheckable): string {
  const date = String(tx.date || "").slice(0, 10);
  const title = txLabel(tx).toLowerCase().replace(/\s+/g, " ");
  return `existing:${date}|${tx.type}|${Number(tx.amount).toFixed(2)}|${title}`;
}

function candidatePeerKey(index: number): string {
  return `batch:${index}`;
}

function serializeForPrompt(id: string, tx: AiNearDuplicateCheckable): Record<string, string | number> {
  return {
    id,
    date: String(tx.date || "").slice(0, 10),
    type: String(tx.type || ""),
    amount: Number(tx.amount) || 0,
    title: txLabel(tx),
  };
}

function sampleExisting(
  existing: AiNearDuplicateCheckable[] | undefined,
  cap: number,
): AiNearDuplicateCheckable[] {
  if (!existing?.length || cap <= 0) return [];
  if (existing.length <= cap) return existing;
  // Prefer most recent by date string (YYYY-MM-DD sorts lexicographically).
  return existing
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, cap);
}

function parsePairs(raw: unknown): AiNearDuplicatePair[] {
  if (!raw || typeof raw !== "object") return [];
  const pairs = (raw as AiNearDuplicateModelResponse).pairs;
  if (!Array.isArray(pairs)) return [];

  const out: AiNearDuplicatePair[] = [];
  for (const item of pairs) {
    if (!item || typeof item !== "object") continue;
    const a = typeof item.a === "string" ? item.a.trim() : "";
    const b = typeof item.b === "string" ? item.b.trim() : "";
    const reason = typeof item.reason === "string" ? item.reason.trim().slice(0, 120) : "";
    const confidence = Number(item.confidence);
    if (!a || !b || a === b) continue;
    if (!Number.isFinite(confidence) || confidence < AI_NEAR_DUPLICATE.MIN_CONFIDENCE) continue;
    out.push({ a, b, reason: reason || "Likely near-duplicate", confidence });
  }
  return out;
}

function buildPrompt(
  candidates: Array<{ id: string; tx: AiNearDuplicateCheckable }>,
  existing: Array<{ id: string; tx: AiNearDuplicateCheckable }>,
): string {
  return [
    AI_NEAR_DUPLICATE.PROMPT_SCHEMA,
    "",
    "Candidates (flag within this list and/or against existing):",
    JSON.stringify(candidates.map(({ id, tx }) => serializeForPrompt(id, tx))),
    "",
    "Existing ledger sample (flag candidate → existing only; do not invent existing ids):",
    JSON.stringify(existing.map(({ id, tx }) => serializeForPrompt(id, tx))),
  ].join("\n");
}

async function callNearDuplicateModel(
  candidates: Array<{ id: string; tx: AiNearDuplicateCheckable }>,
  existing: Array<{ id: string; tx: AiNearDuplicateCheckable }>,
): Promise<AiNearDuplicatePair[]> {
  const { generateGeminiJson } = await import("@/lib/ai/geminiClient");
  const raw = await generateGeminiJson({
    prompt: buildPrompt(candidates, existing),
    systemInstruction: AI_NEAR_DUPLICATE.SYSTEM_INSTRUCTION,
    temperature: AI_NEAR_DUPLICATE.TEMPERATURE,
    timeoutMs: AI_NEAR_DUPLICATE.TIMEOUT_MS,
    model: STATEMENT_IMPORT.GEMINI_MODEL,
    json: true,
    dedupeKey: `ai-near-dupe:${candidates.length}:${existing.length}:${candidates[0]?.id ?? ""}`,
  });
  return parsePairs(raw);
}

function applyPairFlags<T extends AiNearDuplicateCheckable & AiNearDuplicateFlags>(
  rows: T[],
  batchIndices: number[],
  pairs: AiNearDuplicatePair[],
  existingById: Map<string, AiNearDuplicateCheckable>,
): number {
  let flagged = 0;
  const idToIndex = new Map<string, number>();
  for (const index of batchIndices) {
    idToIndex.set(`c${index}`, index);
  }

  for (const pair of pairs) {
    const aIsCandidate = pair.a.startsWith("c");
    const bIsCandidate = pair.b.startsWith("c");
    const aIsExisting = pair.a.startsWith("e");
    const bIsExisting = pair.b.startsWith("e");

    // Candidate ↔ candidate
    if (aIsCandidate && bIsCandidate) {
      const ia = idToIndex.get(pair.a);
      const ib = idToIndex.get(pair.b);
      if (ia == null || ib == null) continue;
      const peerA = candidatePeerKey(ib);
      const peerB = candidatePeerKey(ia);
      if (!rows[ia].possibleAiDuplicate) flagged += 1;
      if (!rows[ib].possibleAiDuplicate) flagged += 1;
      rows[ia] = {
        ...rows[ia],
        possibleAiDuplicate: true,
        aiDuplicateReason: pair.reason,
        aiDuplicatePeerKey: rows[ia].aiDuplicatePeerKey || peerA,
      };
      rows[ib] = {
        ...rows[ib],
        possibleAiDuplicate: true,
        aiDuplicateReason: pair.reason,
        aiDuplicatePeerKey: rows[ib].aiDuplicatePeerKey || peerB,
      };
      continue;
    }

    // Candidate ↔ existing — flag only the candidate
    const candidateId = aIsCandidate ? pair.a : bIsCandidate ? pair.b : null;
    const existingId = aIsExisting ? pair.a : bIsExisting ? pair.b : null;
    if (!candidateId || !existingId) continue;
    const idx = idToIndex.get(candidateId);
    const existingTx = existingById.get(existingId);
    if (idx == null || !existingTx) continue;
    if (!rows[idx].possibleAiDuplicate) flagged += 1;
    rows[idx] = {
      ...rows[idx],
      possibleAiDuplicate: true,
      aiDuplicateReason: pair.reason,
      aiDuplicatePeerKey: rows[idx].aiDuplicatePeerKey || existingPeerKey(existingTx),
    };
  }

  return flagged;
}

function emptyMeta(partial: Partial<AiNearDuplicateMeta>): AiNearDuplicateMeta {
  return {
    ran: false,
    flaggedCount: 0,
    batchesProcessed: 0,
    ...partial,
  };
}

/**
 * Second-pass near-duplicate detection after hard date/amount dedupe.
 * Flags candidates for Review — never removes transactions.
 * Gracefully skips when the API key is missing or the model fails.
 */
export async function flagNearDuplicatesWithAi<T extends AiNearDuplicateCheckable & AiNearDuplicateFlags>(
  transactions: T[],
  options: FlagNearDuplicatesOptions = {},
): Promise<FlagNearDuplicatesResult<T>> {
  if (options.enabled === false) {
    return {
      transactions,
      meta: emptyMeta({ skippedReason: AI_NEAR_DUPLICATE.SKIP_REASONS.DISABLED }),
    };
  }

  if (!transactions.length) {
    return {
      transactions,
      meta: emptyMeta({ skippedReason: AI_NEAR_DUPLICATE.SKIP_REASONS.EMPTY }),
    };
  }

  if (!hasGeminiApiKey()) {
    return {
      transactions,
      meta: emptyMeta({ skippedReason: AI_NEAR_DUPLICATE.SKIP_REASONS.MISSING_API_KEY }),
    };
  }

  const existingSample = sampleExisting(
    options.existingTransactions,
    AI_NEAR_DUPLICATE.EXISTING_SAMPLE_CAP,
  );
  const existingEntries = existingSample.map((tx, i) => ({
    id: `e${i}`,
    tx,
  }));
  const existingById = new Map(existingEntries.map((e) => [e.id, e.tx]));

  const working = transactions.slice() as T[];
  let flaggedCount = 0;
  let batchesProcessed = 0;

  try {
    const batches = chunkArray(
      working.map((tx, index) => ({ tx, index })),
      AI_NEAR_DUPLICATE.BATCH_SIZE,
    );

    for (const batch of batches) {
      const batchIndices = batch.map(({ index }) => index);
      const candidates = batch.map(({ tx, index }) => ({
        id: `c${index}`,
        tx,
      }));

      const pairs = await callNearDuplicateModel(candidates, existingEntries);
      batchesProcessed += 1;
      flaggedCount += applyPairFlags(working, batchIndices, pairs, existingById);
    }

    return {
      transactions: working,
      meta: {
        ran: true,
        flaggedCount,
        batchesProcessed,
      },
    };
  } catch {
    // Keep any flags applied before the failure; never forward provider Error.message.
    return {
      transactions: working,
      meta: {
        ran: batchesProcessed > 0,
        skippedReason: AI_NEAR_DUPLICATE.SKIP_REASONS.ERROR,
        error: AI_NEAR_DUPLICATE.USER_SAFE_ERROR,
        flaggedCount,
        batchesProcessed,
      },
    };
  }
}
