/**
 * CRED Protect Gmail fetch + parse pipeline (bills → Bills, spend → Review).
 */

import { CRED_DEFAULTS, CRED_ERROR_MESSAGES, CRED_QUERIES, GMAIL_DEFAULTS } from "@constants";

import { runWithConcurrency } from "@utils/runWithConcurrency";

import { parseCredEmail, toCredBillDraft, toCredSpendTransaction } from "@/lib/gmail/credParser";
import type { CredBillDraft, CredSyncResult } from "@/lib/gmail/credParser.types";
import { getGmailMessage, searchGmailMessages } from "@/lib/gmail/gmailClient";

function formatGmailDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/**
 * Build a date-scoped CRED Protect query (primary sender).
 */
export function buildCredGmailQuery(options?: { daysBack?: number; startDate?: string; endDate?: string }): string {
  const clauses: string[] = [CRED_QUERIES.PROTECT];

  if (options?.startDate) {
    const parsedStart = new Date(options.startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      clauses.push(`after:${formatGmailDate(parsedStart)}`);
    }
  } else {
    const days = options?.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    clauses.push(`after:${formatGmailDate(cutoff)}`);
  }

  if (options?.endDate) {
    const parsedEnd = new Date(options.endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      const nextDay = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000);
      clauses.push(`before:${formatGmailDate(nextDay)}`);
    }
  }

  return clauses.join(" ").trim();
}

/**
 * Search CRED Protect mail, parse bills/spend, return drafts for client routing.
 */
export async function syncCredEmails(
  accessToken: string,
  options?: {
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    maxEmails?: number;
  },
): Promise<CredSyncResult> {
  const result: CredSyncResult = {
    emailsScanned: 0,
    bills: [],
    spendTransactions: [],
    skippedOther: 0,
    errors: [],
  };

  const query = buildCredGmailQuery(options);
  const messages = await searchGmailMessages(
    accessToken,
    query,
    options?.maxEmails ?? CRED_DEFAULTS.MAX_SEARCH_RESULTS,
  );
  result.emailsScanned = messages.length;
  if (messages.length === 0) return result;

  const parsedRows = await runWithConcurrency(messages, GMAIL_DEFAULTS.SYNC_MESSAGE_CONCURRENCY, async (item) => {
    try {
      const msg = await getGmailMessage(accessToken, item.id);
      return parseCredEmail({
        messageId: msg.id,
        subject: msg.subject,
        snippet: msg.snippet,
        bodyHtml: msg.bodyHtml,
        bodyText: msg.bodyText,
        date: msg.date || msg.internalDate,
      });
    } catch {
      result.errors.push(CRED_ERROR_MESSAGES.PARSE_FAILED);
      return null;
    }
  });

  const billById = new Map<string, CredBillDraft>();

  for (const parsed of parsedRows) {
    if (!parsed) continue;

    if (parsed.kind === "bill") {
      const draft = toCredBillDraft(parsed);
      if (!draft) {
        result.skippedOther++;
        continue;
      }
      // Same card+period → keep latest email’s draft (amount/due may refresh).
      billById.set(draft.id, draft);
      continue;
    }

    if (parsed.kind === "spend") {
      const tx = toCredSpendTransaction(parsed);
      if (tx) result.spendTransactions.push(tx);
      else result.skippedOther++;
      continue;
    }

    result.skippedOther++;
  }

  result.bills = [...billById.values()];
  return result;
}
