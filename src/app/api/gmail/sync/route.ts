import { NextResponse } from "next/server";

import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";

import type { GmailSyncOptions, GmailSyncResponse } from "@/types/gmail";

import { collectNovelCategories } from "@utils/categoryNormalize";
import { hasDuplicate, type DuplicateCheckable } from "@utils/duplicateDetection";

import { buildGmailBankQuery } from "@/lib/gmail/bankFilters";
import { parseEmailAlert } from "@/lib/gmail/emailAlertParser";
import { downloadGmailAttachment, getGmailMessage, searchGmailMessages } from "@/lib/gmail/gmailClient";
import { refreshAccessToken } from "@/lib/gmail/googleAuth";
import { getStoredGmailAccount, saveGmailTokens, updateLastSync } from "@/lib/gmail/storage";
import { parseStatementWithAi } from "@/lib/statement/aiParse";
import { extractPdfText, normalizeStatementText } from "@/lib/statement/extractText";
import type { ParsedStatementTransaction } from "@/lib/statement/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = GMAIL_DEFAULTS.MAX_DURATION_SECONDS;

interface SyncRequestBody extends GmailSyncOptions {
  userId?: string;
  existingTransactions?: DuplicateCheckable[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SyncRequestBody;
    const userId = body.userId || GMAIL_DEFAULTS.DEFAULT_USER_ID;
    const daysBack = body.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK;
    const startDate = body.startDate;
    const endDate = body.endDate;
    const includeAlerts = body.includeAlerts !== false;
    const includeAttachments = body.includeAttachments !== false;
    const pdfPassword = body.pdfPassword;
    const existingTransactions = body.existingTransactions || [];

    const account = await getStoredGmailAccount(userId);
    if (!account || !account.refreshToken) {
      return NextResponse.json({ error: GMAIL_ERROR_MESSAGES.ACCOUNT_NOT_CONNECTED }, { status: 401 });
    }

    // Refresh access token if expired or about to expire in next threshold
    let accessToken = account.accessToken || "";
    if (
      !accessToken ||
      !account.expiresAt ||
      Date.now() > account.expiresAt - GMAIL_DEFAULTS.TOKEN_REFRESH_EXPIRY_THRESHOLD_MS
    ) {
      try {
        const refreshed = await refreshAccessToken(account.refreshToken);
        accessToken = refreshed.access_token;
        await saveGmailTokens(userId, {
          refreshToken: account.refreshToken,
          accessToken: refreshed.access_token,
          expiresIn: refreshed.expires_in,
          email: account.email,
        });
      } catch (refreshErr) {
        return NextResponse.json(
          {
            error: `${GMAIL_ERROR_MESSAGES.TOKEN_REFRESH_FAILED}: ${refreshErr instanceof Error ? refreshErr.message : "Unknown error"}. Please reconnect Gmail.`,
          },
          { status: 401 },
        );
      }
    }

    // 1. Search bank emails
    const query = buildGmailBankQuery({ startDate, endDate, daysBack });
    const messages = await searchGmailMessages(accessToken, query, body.maxEmails || GMAIL_DEFAULTS.MAX_SEARCH_RESULTS);

    const allParsed: ParsedStatementTransaction[] = [];
    const errors: string[] = [];
    let statementAttachmentsFound = 0;
    let alertEmailsFound = 0;

    // 2. Fetch and parse each matching message
    for (const item of messages) {
      try {
        const msg = await getGmailMessage(accessToken, item.id);

        // A. Handle Attachments (PDF / CSV e-Statements)
        if (includeAttachments && msg.attachments && msg.attachments.length > 0) {
          for (const att of msg.attachments) {
            const filename = (att.filename || "").toLowerCase();
            const isPdf = filename.endsWith(".pdf") || att.mimeType.includes("pdf");
            const isCsv =
              filename.endsWith(".csv") ||
              filename.endsWith(".txt") ||
              att.mimeType.includes("csv") ||
              att.mimeType.includes("text");

            if (!isPdf && !isCsv) continue;

            statementAttachmentsFound++;

            try {
              const data = await downloadGmailAttachment(accessToken, msg.id, att.attachmentId);

              let extractedText = "";
              if (isPdf) {
                // PDF buffer
                const arrayBuffer = data.buffer.slice(
                  data.byteOffset,
                  data.byteOffset + data.byteLength,
                ) as ArrayBuffer;
                extractedText = await extractPdfText(arrayBuffer, pdfPassword);
              } else {
                extractedText = normalizeStatementText(new TextDecoder("utf-8").decode(data));
              }

              if (extractedText.trim()) {
                const parsedTxs = await parseStatementWithAi(extractedText);
                if (parsedTxs && parsedTxs.length > 0) {
                  allParsed.push(...parsedTxs);
                }
              }
            } catch (attErr) {
              errors.push(
                `Failed parsing attachment "${att.filename}": ${attErr instanceof Error ? attErr.message : "Unknown error"}`,
              );
            }
          }
        }

        // B. Handle Transaction Alert Emails (HTML / Text body)
        if (includeAlerts) {
          try {
            const alertTxs = await parseEmailAlert(msg.subject, msg.bodyHtml, msg.bodyText, msg.date);
            if (alertTxs && alertTxs.length > 0) {
              alertEmailsFound++;
              allParsed.push(...alertTxs);
            }
          } catch (alertErr) {
            errors.push(
              `Failed parsing alert "${msg.subject}": ${alertErr instanceof Error ? alertErr.message : "Unknown error"}`,
            );
          }
        }
      } catch (msgErr) {
        errors.push(
          `Failed processing message ${item.id}: ${msgErr instanceof Error ? msgErr.message : "Unknown error"}`,
        );
      }
    }

    // 3. Deduplicate transactions
    const uniqueBatch: ParsedStatementTransaction[] = [];
    let duplicatesCount = 0;

    for (const tx of allParsed) {
      // Check against both existing DB transactions and transactions within this batch
      const isDupInDb = hasDuplicate(tx, existingTransactions);
      const isDupInBatch = hasDuplicate(tx, uniqueBatch);

      if (isDupInDb || isDupInBatch) {
        duplicatesCount++;
      } else {
        uniqueBatch.push(tx);
      }
    }

    // 4. Update sync timestamp
    await updateLastSync(userId);

    const discoveredCategories = collectNovelCategories(uniqueBatch);

    const response: GmailSyncResponse = {
      transactions: uniqueBatch,
      meta: {
        emailsScanned: messages.length,
        statementAttachmentsFound,
        alertEmailsFound,
        totalParsed: allParsed.length,
        newCount: uniqueBatch.length,
        duplicatesCount,
        errors,
        discoveredCategories,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to sync transactions from Gmail",
      },
      { status: 500 },
    );
  }
}
