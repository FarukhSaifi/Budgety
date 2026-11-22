/**
 * Parser for CRED Protect emails (protect@cred.club).
 * Extracts CC bill due amounts / dates and spend-like alerts.
 */

import { CRED_DEFAULTS, CRED_ERROR_MESSAGES, EXPENSE_CATEGORIES, TRANSACTION_MODES } from "@constants";

import { toStorageDate, todayStorage } from "@utils/dateUtils";

import type { CredBillDraft, CredEmailKind, ParsedCredEmail } from "@/lib/gmail/credParser.types";
import type { ParsedStatementTransaction } from "@/lib/statement/types";
import type { PaymentMode } from "@/types";

const MONTH_NAMES = "January|February|March|April|May|June|July|August|September|October|November|December";

function cleanHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8377;/gi, "₹")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAmount(raw: string): number {
  return Math.abs(parseFloat(raw.replace(/,/g, "")) || 0);
}

function extractInrAmount(text: string, labelPattern: RegExp): number | null {
  const re = new RegExp(`${labelPattern.source}\\s*(?:of\\s*)?(?:₹|INR|Rs\\.?\\s*)([\\d,]+(?:\\.\\d{1,2})?)`, "i");
  const m = text.match(re);
  if (!m?.[1]) return null;
  const n = normalizeAmount(m[1]);
  return n > 0 ? n : null;
}

function parseFlexibleDate(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  // "December 08, 2026" / "Dec 19, 2026" / "08 December 2026"
  const stored = toStorageDate(cleaned);
  if (stored) return stored;
  return null;
}

function monthLabelToPeriod(label: string, emailDate: string): string | null {
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };
  const key = label.trim().toLowerCase();
  const month = months[key];
  if (!month) return null;

  const base = toStorageDate(emailDate) || todayStorage();
  const emailYear = Number(base.slice(0, 4));
  const emailMonth = Number(base.slice(5, 7));
  // Bill for December emailed in January → previous year.
  let year = emailYear;
  if (month === 12 && emailMonth <= 2) year = emailYear - 1;
  if (month <= 2 && emailMonth >= 11) year = emailYear; // keep current when emailed late year
  return `${year}-${String(month).padStart(2, "0")}`;
}

function classifyKind(subject: string, body: string): CredEmailKind {
  const t = `${subject} ${body}`.toLowerCase();
  if (
    /total amount due|minimum due|smart statement|new bill for your|credit card bill for|bill has been generated|bill summary/.test(
      t,
    )
  ) {
    return "bill";
  }
  if (/spent|transaction|debited|purchase|charged|₹\s*[\d,]+/.test(t) && /card|upi|paid/.test(t)) {
    return "spend";
  }
  return "other";
}

function extractCard(subject: string, body: string): { issuer: string | null; last4: string | null } {
  // Subject: "New bill for your ICICI Bank card XXXX-2005 is here"
  const subjectMatch = subject.match(/(?:for your|for)\s+(.+?)\s+card\s+(?:XXXX[-\s]?)?(\d{4})\b/i);
  if (subjectMatch) {
    return { issuer: subjectMatch[1].trim(), last4: subjectMatch[2] };
  }

  // Body: "ICICI Bank •••• 5007" or "AMEX •••• 1000"
  const bodyMatch = body.match(/([A-Za-z][A-Za-z0-9 &.]{1,40}?)\s*[•·*.]{2,}\s*(\d{4})\b/);
  if (bodyMatch) {
    return { issuer: bodyMatch[1].trim(), last4: bodyMatch[2] };
  }

  const last4Only = body.match(/(?:XXXX[-\s]?|ending\s+|•••+\s*)(\d{4})\b/i);
  return { issuer: null, last4: last4Only?.[1] ?? null };
}

function slugifyIssuer(issuer: string | null): string {
  if (!issuer) return "card";
  return (
    issuer
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32) || "card"
  );
}

/**
 * Parse a CRED email into a structured result.
 */
export function parseCredEmail(input: {
  messageId: string;
  subject: string;
  snippet?: string;
  bodyHtml?: string;
  bodyText?: string;
  date?: string;
}): ParsedCredEmail {
  const subject = input.subject || "";
  const snippet = input.snippet || "";
  const body = cleanHtmlToText([input.bodyText || "", input.bodyHtml || "", snippet].filter(Boolean).join("\n"));
  const emailDate = toStorageDate(input.date) || todayStorage();
  const kind = classifyKind(subject, body);
  const { issuer, last4 } = extractCard(subject, body);

  const billingMonthMatch =
    body.match(new RegExp(`credit card bill for\\s+(${MONTH_NAMES})\\b`, "i")) ||
    subject.match(new RegExp(`\\b(${MONTH_NAMES})\\b`, "i"));
  const billingMonthLabel = billingMonthMatch?.[1] ?? null;
  const billingPeriod = billingMonthLabel ? monthLabelToPeriod(billingMonthLabel, emailDate) : emailDate.slice(0, 7);

  const amount =
    extractInrAmount(body, /total amount due/) ??
    extractInrAmount(body, /amount due/) ??
    extractInrAmount(snippet, /total amount due/) ??
    extractInrAmount(body, /spent/) ??
    null;

  const minimumDue = extractInrAmount(body, /minimum due/);

  const dueMatch =
    body.match(/due date\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
    body.match(/due(?:\s+on)?\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  const dueDate = dueMatch?.[1] ? parseFlexibleDate(dueMatch[1]) : null;

  return {
    messageId: input.messageId,
    kind,
    subject,
    snippet,
    cardIssuer: issuer,
    cardLast4: last4,
    billingMonthLabel,
    billingPeriod,
    amount,
    minimumDue,
    dueDate,
    emailDate,
  };
}

/**
 * Map a parsed CRED bill into a deterministic Bill draft for Firestore upsert.
 */
export function toCredBillDraft(parsed: ParsedCredEmail): CredBillDraft | null {
  if (parsed.kind !== "bill" || !parsed.amount || parsed.amount <= 0) return null;

  const period = parsed.billingPeriod || parsed.emailDate.slice(0, 7);
  const last4 = parsed.cardLast4 || "0000";
  const issuerSlug = slugifyIssuer(parsed.cardIssuer);
  const id = `${CRED_DEFAULTS.BILL_ID_PREFIX}_${issuerSlug}_${last4}_${period}`;

  const cardLabel = parsed.cardIssuer ? `${parsed.cardIssuer} •••• ${last4}` : `Card •••• ${last4}`;
  const title = `CRED · ${cardLabel}`;

  const dueDate =
    parsed.dueDate ||
    // Fallback: 20th of next month after billing period when CRED omits due date.
    (() => {
      const [y, m] = period.split("-").map(Number);
      const next = new Date(y, m, 20); // month index = m (next month)
      return toStorageDate(next.toISOString()) || parsed.emailDate;
    })();

  return {
    id,
    title,
    amount: parsed.amount,
    dueDate,
    category: CRED_DEFAULTS.BILL_CATEGORY,
    source: CRED_DEFAULTS.BILL_SOURCE,
    reminderDays: CRED_DEFAULTS.BILL_REMINDER_DAYS,
    recurrence: "monthly",
    status: "pending",
    isPaid: false,
    isRecurring: true,
    messageId: parsed.messageId,
    cardLast4: parsed.cardLast4,
    billingPeriod: period,
  };
}

/**
 * Map a spend-like CRED email into a Review-staging transaction.
 */
export function toCredSpendTransaction(parsed: ParsedCredEmail): ParsedStatementTransaction | null {
  if (parsed.kind !== "spend" || !parsed.amount || parsed.amount <= 0) return null;

  const card = parsed.cardIssuer ? `${parsed.cardIssuer} •••• ${parsed.cardLast4 || "????"}` : "CRED card";
  const title = parsed.subject.slice(0, 80) || `CRED spend · ${card}`;

  const paymentMode = TRANSACTION_MODES.CARD as PaymentMode;

  return {
    title,
    amount: parsed.amount,
    type: "expense",
    category: EXPENSE_CATEGORIES.CREDIT_CARD,
    paymentMode,
    date: parsed.emailDate,
    isRecurring: false,
    imported: true,
    description: title,
    mode: paymentMode,
  };
}

export function safeParseCredEmail(input: Parameters<typeof parseCredEmail>[0]): {
  parsed: ParsedCredEmail | null;
  error?: string;
} {
  try {
    return { parsed: parseCredEmail(input) };
  } catch {
    return { parsed: null, error: CRED_ERROR_MESSAGES.PARSE_FAILED };
  }
}
