import { NextResponse } from "next/server";

import { ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import { collectNovelCategories } from "@utils/categoryNormalize";

import { flagNearDuplicatesWithAi } from "@/lib/statement/aiNearDuplicate";
import { classifyAiParseError, parseStatementWithAi } from "@/lib/statement/aiParse";
import { parsePdfStatementChunked } from "@/lib/statement/chunkedParse";
import { normalizeStatementText } from "@/lib/statement/extractText";
import { isPdfPasswordError } from "@/lib/statement/pdfPasswordError";
import type { ParseStatementError, ParseStatementSuccess, StatementFileKind } from "@/lib/statement/types";
import { requireUserFromRequest, UserAuthError } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonError(message: string, status: number, code?: string) {
  const body: ParseStatementError = code ? { error: message, code } : { error: message };
  return NextResponse.json(body, { status });
}

function detectKind(file: File): StatementFileKind | null {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (name.endsWith(".csv") || type === "text/csv" || type === "text/plain" || type === "application/vnd.ms-excel") {
    return "csv";
  }
  return null;
}

function readPdfPassword(form: FormData): string | undefined {
  const raw = form.get(STATEMENT_IMPORT.PASSWORD_FIELD_NAME);
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

export async function POST(request: Request) {
  try {
    await requireUserFromRequest(request);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError(ERROR_MESSAGES.PARSE_STATEMENT_FAILED, 400);
    }

    const entry = form.get(STATEMENT_IMPORT.FIELD_NAME);

    if (!(entry instanceof File)) {
      return jsonError(ERROR_MESSAGES.PARSE_STATEMENT_FAILED, 400);
    }

    if (entry.size <= 0) {
      return jsonError(ERROR_MESSAGES.STATEMENT_EMPTY_TEXT, 400);
    }

    if (entry.size > STATEMENT_IMPORT.MAX_FILE_BYTES) {
      const maxMb = Math.round(STATEMENT_IMPORT.MAX_FILE_BYTES / (1024 * 1024));
      return jsonError(ERROR_MESSAGES.STATEMENT_FILE_TOO_LARGE.replace("{maxMb}", String(maxMb)), 413);
    }

    const kind = detectKind(entry);
    if (!kind) {
      return jsonError(ERROR_MESSAGES.STATEMENT_UNSUPPORTED_TYPE, 415);
    }

    const pdfPassword = readPdfPassword(form);

    if (kind === "pdf") {
      const buffer = await entry.arrayBuffer();
      let chunked;
      try {
        chunked = await parsePdfStatementChunked(buffer, { password: pdfPassword });
      } catch (err) {
        if (isPdfPasswordError(err)) {
          const status =
            err.code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT
              ? STATEMENT_IMPORT.PDF_PASSWORD_INCORRECT_HTTP_STATUS
              : STATEMENT_IMPORT.PDF_PASSWORD_REQUIRED_HTTP_STATUS;
          return jsonError(err.message, status, err.code);
        }
        throw err;
      }

      if (chunked.transactions.length === 0) {
        if (chunked.meta.parseFailureCode && chunked.meta.parseFailureMessage) {
          const status =
            chunked.meta.parseFailureCode === STATEMENT_IMPORT.AI_ERROR_CODES.RATE_LIMITED ||
            chunked.meta.parseFailureCode === STATEMENT_IMPORT.AI_ERROR_CODES.UNAVAILABLE
              ? STATEMENT_IMPORT.AI_UNAVAILABLE_HTTP_STATUS
              : 502;
          return jsonError(chunked.meta.parseFailureMessage, status, chunked.meta.parseFailureCode);
        }
        if (chunked.meta.chunksFailed > 0 && chunked.meta.chunksSucceeded === 0) {
          return jsonError(ERROR_MESSAGES.STATEMENT_ALL_CHUNKS_FAILED, 502);
        }
        return jsonError(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS, 422);
      }

      const discoveredCategories = collectNovelCategories(chunked.transactions);
      const body: ParseStatementSuccess = {
        transactions: chunked.transactions,
        meta: {
          source: "pdf",
          count: chunked.transactions.length,
          discoveredCategories,
          ...chunked.meta,
        },
      };
      return NextResponse.json(body);
    }

    const text = normalizeStatementText(await entry.text());
    if (!text.trim()) {
      return jsonError(ERROR_MESSAGES.STATEMENT_EMPTY_TEXT, 400);
    }

    const parsed = await parseStatementWithAi(text);

    if (parsed.length === 0) {
      return jsonError(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS, 422);
    }

    // Hard dedupe is client-side for CSV; AI second pass flags near-dupes for Review.
    const { transactions, meta: aiNearDuplicate } = await flagNearDuplicatesWithAi(parsed);
    const discoveredCategories = collectNovelCategories(transactions);

    const body: ParseStatementSuccess = {
      transactions,
      meta: {
        source: kind,
        count: transactions.length,
        discoveredCategories,
        aiNearDuplicate,
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof UserAuthError) {
      const unauthorized = err.status === 401;
      return jsonError(
        unauthorized ? ERROR_MESSAGES.AUTH_REQUIRED : err.message,
        err.status,
        unauthorized ? STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE : undefined,
      );
    }
    if (isPdfPasswordError(err)) {
      const status =
        err.code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT
          ? STATEMENT_IMPORT.PDF_PASSWORD_INCORRECT_HTTP_STATUS
          : STATEMENT_IMPORT.PDF_PASSWORD_REQUIRED_HTTP_STATUS;
      return jsonError(err.message, status, err.code);
    }
    const aiErr = classifyAiParseError(err);
    if (aiErr) {
      return jsonError(aiErr.message, aiErr.status, aiErr.code);
    }
    const message = err instanceof Error ? err.message : "";
    if (message === ERROR_MESSAGES.STATEMENT_EMPTY_TEXT) {
      return jsonError(message, 400);
    }
    // Never forward unexpected Error.message (may embed upstream bodies).
    return jsonError(ERROR_MESSAGES.PARSE_STATEMENT_FAILED, 500);
  }
}
