import { NextResponse } from "next/server";

import { ERROR_MESSAGES, GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import type { GmailUnlockAttachmentRequest } from "@/types/gmail";

import { collectNovelCategories } from "@utils/categoryNormalize";

import { GmailAuthError, resolveGmailAccessToken } from "@/lib/gmail/accessToken";
import { downloadGmailAttachment } from "@/lib/gmail/gmailClient";
import { classifyAiParseError } from "@/lib/statement/aiParse";
import { parsePdfStatementChunked } from "@/lib/statement/chunkedParse";
import { isPdfPasswordError } from "@/lib/statement/pdfPasswordError";
import type { ParseStatementError, ParseStatementSuccess } from "@/lib/statement/types";
import { requireOwnedUserId, UserAuthError } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = GMAIL_DEFAULTS.MAX_DURATION_SECONDS;

function jsonError(message: string, status: number, code?: string) {
  const body: ParseStatementError = code ? { error: message, code } : { error: message };
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<GmailUnlockAttachmentRequest>;
    const { userId } = await requireOwnedUserId(request, body.userId);
    const messageId = body.messageId?.trim();
    const attachmentId = body.attachmentId?.trim();
    const pdfPassword = body.pdfPassword?.trim();

    if (!messageId || !attachmentId) {
      return jsonError(GMAIL_ERROR_MESSAGES.UNLOCK_MISSING_FIELDS, 400);
    }
    if (!pdfPassword) {
      return jsonError(
        ERROR_MESSAGES.PDF_PASSWORD_REQUIRED,
        STATEMENT_IMPORT.PDF_PASSWORD_REQUIRED_HTTP_STATUS,
        STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED,
      );
    }

    let accessToken: string;
    try {
      ({ accessToken } = await resolveGmailAccessToken(userId));
    } catch (authErr) {
      if (authErr instanceof GmailAuthError) {
        return jsonError(
          authErr.message,
          authErr.status,
          authErr.status === 401 ? STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE : undefined,
        );
      }
      return jsonError(
        GMAIL_ERROR_MESSAGES.ACCOUNT_NOT_CONNECTED,
        401,
        STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE,
      );
    }

    let data: Uint8Array;
    try {
      data = await downloadGmailAttachment(accessToken, messageId, attachmentId);
    } catch {
      return jsonError(GMAIL_ERROR_MESSAGES.ATTACHMENT_DOWNLOAD_FAILED, 502);
    }

    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

    let chunked;
    try {
      chunked = await parsePdfStatementChunked(arrayBuffer, { password: pdfPassword });
    } catch (err) {
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
      return jsonError(GMAIL_ERROR_MESSAGES.UNLOCK_ATTACHMENT_FAILED, 500);
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
    const success: ParseStatementSuccess = {
      transactions: chunked.transactions,
      meta: {
        source: "pdf",
        count: chunked.transactions.length,
        discoveredCategories,
        ...chunked.meta,
      },
    };
    return NextResponse.json(success);
  } catch (err) {
    if (err instanceof UserAuthError) {
      const unauthorized = err.status === 401;
      return jsonError(
        unauthorized ? ERROR_MESSAGES.AUTH_REQUIRED : err.message,
        err.status,
        unauthorized ? STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE : undefined,
      );
    }
    // Avoid leaking upstream/provider details from unexpected failures.
    return jsonError(GMAIL_ERROR_MESSAGES.UNLOCK_ATTACHMENT_FAILED, 500);
  }
}
