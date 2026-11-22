import { NextResponse } from "next/server";

import { CRED_ERROR_MESSAGES, GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";

import type { GmailLockedAttachment, GmailSyncResponse } from "@/types/gmail";

import { collectNovelCategories } from "@utils/categoryNormalize";
import { hasDuplicate } from "@utils/duplicateDetection";
import { runWithConcurrency } from "@utils/runWithConcurrency";

import { GmailAuthError, resolveGmailAccessToken } from "@/lib/gmail/accessToken";
import { buildGmailBankQuery } from "@/lib/gmail/bankFilters";
import { syncCredEmails } from "@/lib/gmail/credSync";
import { parseEmailAlert } from "@/lib/gmail/emailAlertParser";
import {
  downloadGmailAttachment,
  getGmailMessage,
  searchGmailMessages,
  type GmailAttachment,
  type GmailFetchedMessage,
} from "@/lib/gmail/gmailClient";
import { buildLockedAttachmentMeta } from "@/lib/gmail/lockedAttachmentMeta";
import { updateLastSync } from "@/lib/gmail/storage";
import { flagNearDuplicatesWithAi } from "@/lib/statement/aiNearDuplicate";
import { parseStatementWithAi } from "@/lib/statement/aiParse";
import { parsePdfStatementChunked } from "@/lib/statement/chunkedParse";
import { normalizeStatementText } from "@/lib/statement/extractText";
import { isPdfPasswordError } from "@/lib/statement/pdfPasswordError";
import type { ParsedStatementTransaction } from "@/lib/statement/types";
import { requireOwnedUserId, UserAuthError } from "@/lib/userAuth";

import type { MessageParseResult, SyncRequestBody } from "./route.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Must be a literal — Next.js segment config is statically analyzed (see GMAIL_DEFAULTS.MAX_DURATION_SECONDS). */
export const maxDuration = 120;

function lockedAttachmentId(messageId: string, attachmentId: string): string {
  return `${messageId}:${attachmentId}`;
}

function isStatementAttachment(att: GmailAttachment): { isPdf: boolean; isCsv: boolean } {
  const filename = (att.filename || "").toLowerCase();
  const isPdf = filename.endsWith(".pdf") || att.mimeType.includes("pdf");
  const isCsv =
    filename.endsWith(".csv") ||
    filename.endsWith(".txt") ||
    att.mimeType.includes("csv") ||
    att.mimeType.includes("text");
  return { isPdf, isCsv };
}

async function parseAttachment(
  accessToken: string,
  msg: GmailFetchedMessage,
  att: GmailAttachment,
  pdfPassword: string | undefined,
): Promise<{
  parsed: ParsedStatementTransaction[];
  locked?: GmailLockedAttachment;
  error?: string;
}> {
  const { isPdf, isCsv } = isStatementAttachment(att);
  if (!isPdf && !isCsv) return { parsed: [] };

  try {
    const data = await downloadGmailAttachment(accessToken, msg.id, att.attachmentId);

    if (isPdf) {
      const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      // Defer AI near-dupe to the final sync merge (cross-message + existing sample).
      const chunked = await parsePdfStatementChunked(arrayBuffer, {
        password: pdfPassword,
        runAiNearDuplicate: false,
      });
      const errors: string[] = [];
      if (chunked.meta.chunkErrors?.length) {
        errors.push(...chunked.meta.chunkErrors);
      }
      if (!chunked.transactions.length && chunked.meta.chunksFailed > 0 && chunked.meta.chunksSucceeded === 0) {
        return {
          parsed: [],
          error:
            chunked.meta.chunkErrors?.[0] ??
            GMAIL_ERROR_MESSAGES.ATTACHMENT_PARSE_FAILED.replace(
              "{filename}",
              att.filename || GMAIL_DEFAULTS.FALLBACK_ATTACHMENT_FILENAME,
            ),
        };
      }
      return {
        parsed: chunked.transactions,
        error: errors.length ? errors.join(" ") : undefined,
      };
    }

    const extractedText = normalizeStatementText(new TextDecoder("utf-8").decode(data));
    if (!extractedText.trim()) return { parsed: [] };

    const parsedTxs = await parseStatementWithAi(extractedText);
    return { parsed: parsedTxs?.length ? parsedTxs : [] };
  } catch (attErr) {
    if (isPdfPasswordError(attErr)) {
      const filename = att.filename || GMAIL_DEFAULTS.FALLBACK_PDF_FILENAME;
      const meta = buildLockedAttachmentMeta(msg, filename);
      return {
        parsed: [],
        locked: {
          id: lockedAttachmentId(msg.id, att.attachmentId),
          messageId: msg.id,
          attachmentId: att.attachmentId,
          filename,
          mimeType: att.mimeType || "application/pdf",
          ...meta,
        },
      };
    }
    return {
      parsed: [],
      error: GMAIL_ERROR_MESSAGES.ATTACHMENT_PARSE_FAILED.replace(
        "{filename}",
        att.filename || GMAIL_DEFAULTS.FALLBACK_ATTACHMENT_FILENAME,
      ),
    };
  }
}

async function processMessage(
  accessToken: string,
  messageId: string,
  options: {
    includeAttachments: boolean;
    includeAlerts: boolean;
    pdfPassword?: string;
  },
): Promise<MessageParseResult> {
  const result: MessageParseResult = {
    parsed: [],
    locked: [],
    errors: [],
    statementAttachmentsFound: 0,
    alertEmailsFound: 0,
  };

  try {
    const msg = await getGmailMessage(accessToken, messageId);

    if (options.includeAttachments && msg.attachments?.length) {
      const statementAtts = msg.attachments.filter((att) => {
        const { isPdf, isCsv } = isStatementAttachment(att);
        return isPdf || isCsv;
      });
      result.statementAttachmentsFound = statementAtts.length;

      const attResults = await Promise.allSettled(
        statementAtts.map((att) => parseAttachment(accessToken, msg, att, options.pdfPassword)),
      );

      for (const settled of attResults) {
        if (settled.status === "rejected") {
          result.errors.push(
            GMAIL_ERROR_MESSAGES.ATTACHMENT_PARSE_FAILED.replace(
              "{filename}",
              GMAIL_DEFAULTS.FALLBACK_ATTACHMENT_FILENAME,
            ),
          );
          continue;
        }
        const value = settled.value;
        if (value.parsed.length) result.parsed.push(...value.parsed);
        if (value.locked) result.locked.push(value.locked);
        if (value.error) result.errors.push(value.error);
      }
    }

    if (options.includeAlerts) {
      try {
        const alertTxs = await parseEmailAlert(msg.subject, msg.bodyHtml, msg.bodyText, msg.date);
        if (alertTxs?.length) {
          result.alertEmailsFound = 1;
          result.parsed.push(...alertTxs);
        }
      } catch {
        result.errors.push(GMAIL_ERROR_MESSAGES.ALERT_PARSE_FAILED);
      }
    }
  } catch {
    result.errors.push(GMAIL_ERROR_MESSAGES.MESSAGE_PROCESS_FAILED);
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SyncRequestBody;
    const { userId } = await requireOwnedUserId(request, body.userId);
    const daysBack = body.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK;
    const startDate = body.startDate;
    const endDate = body.endDate;
    const includeAlerts = body.includeAlerts !== false;
    const includeAttachments = body.includeAttachments !== false;
    const includeCred = body.includeCred !== false;
    const pdfPassword = body.pdfPassword?.trim() || undefined;
    const existingTransactions = body.existingTransactions || [];

    let accessToken: string;
    try {
      ({ accessToken } = await resolveGmailAccessToken(userId));
    } catch (authErr) {
      if (authErr instanceof GmailAuthError) {
        return NextResponse.json({ error: authErr.message }, { status: authErr.status });
      }
      return NextResponse.json({ error: GMAIL_ERROR_MESSAGES.ACCOUNT_NOT_CONNECTED }, { status: 401 });
    }

    // Pass source toggles into the query so disabled alerts don't consume maxResults
    // and crowd out statement PDFs (and vice versa).
    const query = buildGmailBankQuery({
      startDate,
      endDate,
      daysBack,
      includeAlerts,
      includeStatements: includeAttachments,
    });
    const messages = await searchGmailMessages(accessToken, query, body.maxEmails || GMAIL_DEFAULTS.MAX_SEARCH_RESULTS);

    const messageResults = await runWithConcurrency(messages, GMAIL_DEFAULTS.SYNC_MESSAGE_CONCURRENCY, (item) =>
      processMessage(accessToken, item.id, {
        includeAttachments,
        includeAlerts,
        pdfPassword,
      }),
    );

    const allParsed: ParsedStatementTransaction[] = [];
    const errors: string[] = [];
    const lockedAttachments: GmailLockedAttachment[] = [];
    let statementAttachmentsFound = 0;
    let alertEmailsFound = 0;

    for (const result of messageResults) {
      allParsed.push(...result.parsed);
      errors.push(...result.errors);
      lockedAttachments.push(...result.locked);
      statementAttachmentsFound += result.statementAttachmentsFound;
      alertEmailsFound += result.alertEmailsFound;
    }

    // CRED Protect CC bills (separate query — does not compete with bank maxResults).
    let credEmailsScanned = 0;
    let credBills = [] as Awaited<ReturnType<typeof syncCredEmails>>["bills"];
    if (includeCred) {
      try {
        const credResult = await syncCredEmails(accessToken, {
          daysBack,
          startDate,
          endDate,
        });
        credEmailsScanned = credResult.emailsScanned;
        credBills = credResult.bills;
        if (credResult.spendTransactions.length) {
          allParsed.push(...credResult.spendTransactions);
        }
        if (credResult.errors.length) {
          errors.push(...credResult.errors);
        }
      } catch {
        errors.push(CRED_ERROR_MESSAGES.SYNC_FAILED);
      }
    }

    const uniqueBatch: ParsedStatementTransaction[] = [];
    let duplicatesCount = 0;

    // First pass: exact hard dedupe (date + type + amount + description).
    for (const tx of allParsed) {
      const isDupInDb = hasDuplicate(tx, existingTransactions);
      const isDupInBatch = hasDuplicate(tx, uniqueBatch);
      if (isDupInDb || isDupInBatch) {
        duplicatesCount++;
      } else {
        uniqueBatch.push(tx);
      }
    }

    // Second pass: AI near-duplicates — flag for Review, never drop.
    const { transactions: flaggedBatch, meta: aiNearDuplicate } = await flagNearDuplicatesWithAi(uniqueBatch, {
      existingTransactions,
    });

    const hadUsableOutcome =
      flaggedBatch.length > 0 ||
      lockedAttachments.length > 0 ||
      credBills.length > 0 ||
      duplicatesCount > 0 ||
      errors.length === 0;

    if (hadUsableOutcome) {
      await updateLastSync(userId);
    }

    const discoveredCategories = collectNovelCategories(flaggedBatch);

    const response: GmailSyncResponse = {
      transactions: flaggedBatch,
      credBills,
      meta: {
        emailsScanned: messages.length + credEmailsScanned,
        statementAttachmentsFound,
        alertEmailsFound,
        totalParsed: allParsed.length,
        newCount: flaggedBatch.length,
        duplicatesCount,
        errors,
        lockedAttachments,
        discoveredCategories,
        aiNearDuplicate,
        credEmailsScanned,
        credBillsFound: credBills.length,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Never forward raw Error.message — upstream providers may embed response bodies.
    return NextResponse.json({ error: GMAIL_ERROR_MESSAGES.SYNC_FAILED }, { status: 500 });
  }
}
