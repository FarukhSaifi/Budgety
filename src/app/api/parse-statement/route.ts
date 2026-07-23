import { NextResponse } from "next/server";

import { ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import { collectNovelCategories } from "@utils/categoryNormalize";

import { parseStatementWithAi } from "@/lib/statement/aiParse";
import {
  extractPdfText,
  normalizeStatementText,
} from "@/lib/statement/extractText";
import type {
  ParseStatementError,
  ParseStatementSuccess,
  StatementFileKind,
} from "@/lib/statement/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  const body: ParseStatementError = { error: message };
  return NextResponse.json(body, { status });
}

function detectKind(file: File): StatementFileKind | null {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (
    name.endsWith(".csv") ||
    type === "text/csv" ||
    type === "text/plain" ||
    type === "application/vnd.ms-excel"
  ) {
    return "csv";
  }
  return null;
}

export async function POST(request: Request) {
  try {
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
      return jsonError(
        ERROR_MESSAGES.STATEMENT_FILE_TOO_LARGE.replace("{maxMb}", String(maxMb)),
        413,
      );
    }

    const kind = detectKind(entry);
    if (!kind) {
      return jsonError(ERROR_MESSAGES.STATEMENT_UNSUPPORTED_TYPE, 415);
    }

    let text = "";
    if (kind === "pdf") {
      const buffer = await entry.arrayBuffer();
      text = await extractPdfText(buffer);
    } else {
      text = normalizeStatementText(await entry.text());
    }

    if (!text.trim()) {
      return jsonError(ERROR_MESSAGES.STATEMENT_EMPTY_TEXT, 400);
    }

    const transactions = await parseStatementWithAi(text);

    if (transactions.length === 0) {
      return jsonError(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS, 422);
    }

    const discoveredCategories = collectNovelCategories(transactions);

    const body: ParseStatementSuccess = {
      transactions,
      meta: {
        source: kind,
        count: transactions.length,
        discoveredCategories,
      },
    };
    return NextResponse.json(body);
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : ERROR_MESSAGES.PARSE_STATEMENT_FAILED;
    const status =
      message === ERROR_MESSAGES.AI_API_KEY_MISSING
        ? 503
        : message.includes("AI")
          ? 502
          : 500;
    return jsonError(message, status);
  }
}
