/**
 * Infer bank/issuer labels and PDF password *format* hints for locked Gmail attachments.
 * Hints are guidance only — never extract or store actual passwords.
 */

import {
  BANK_PASSWORD_HINT_DEFAULTS,
  GMAIL_DEFAULTS,
  GMAIL_UI_TEXT,
  PDF_PASSWORD_HINT_PATTERNS,
} from "@constants";

import type { GmailLockedAttachment } from "@/types/gmail";

import { INDIAN_BANK_PATTERNS } from "@/lib/gmail/bankFilters";
import type { GmailFetchedMessage } from "@/lib/gmail/gmailClient";

function cleanHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(fromHeader: string): string {
  const angle = fromHeader.match(/<([^>]+)>/);
  return (angle?.[1] || fromHeader).trim().toLowerCase();
}

function extractDomain(emailOrFrom: string): string {
  const address = extractEmailAddress(emailOrFrom);
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1) : address;
}

/**
 * Detect bank/issuer short label from sender, subject, and/or filename.
 */
export function detectBankLabel(input: {
  from?: string;
  subject?: string;
  filename?: string;
}): string | undefined {
  const from = (input.from || "").trim();
  const haystack = [input.subject, input.filename].filter(Boolean).join(" ").toLowerCase();
  const email = from ? extractEmailAddress(from) : "";
  const domain = from ? extractDomain(from) : "";

  for (const bank of INDIAN_BANK_PATTERNS) {
    if (email && bank.senders.some((s) => s.toLowerCase() === email)) {
      return bank.shortLabel;
    }
  }

  for (const bank of INDIAN_BANK_PATTERNS) {
    if (domain && bank.domains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
      return bank.shortLabel;
    }
  }

  if (haystack) {
    for (const bank of INDIAN_BANK_PATTERNS) {
      const tokens = [bank.shortLabel, bank.bank, ...bank.domains.map((d) => d.split(".")[0])];
      for (const token of tokens) {
        const t = token.toLowerCase().trim();
        if (t.length < GMAIL_DEFAULTS.BANK_LABEL_MIN_TOKEN_LENGTH) continue;
        // Word-ish match so "sbi" does not hit inside unrelated words.
        const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(t)}(?:[^a-z0-9]|$)`, "i");
        if (re.test(haystack)) return bank.shortLabel;
      }
    }
  }

  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Infer a password-format hint from email body / subject / snippet text.
 * Returns display-ready text (hint + optional example). Never returns secrets.
 */
export function inferPasswordHint(input: {
  subject?: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
}): string | undefined {
  const plainBody =
    (input.bodyText || "").trim() ||
    (input.bodyHtml ? cleanHtmlToText(input.bodyHtml) : "") ||
    "";
  const corpus = [input.subject, input.snippet, plainBody].filter(Boolean).join("\n");
  if (!corpus.trim()) return undefined;

  // Cap scan window — password instructions are usually near the top of the email.
  const scan = corpus.slice(0, GMAIL_DEFAULTS.PASSWORD_HINT_SCAN_CHARS);

  for (const entry of PDF_PASSWORD_HINT_PATTERNS) {
    if (!entry.matchers.some((re) => re.test(scan))) continue;
    if (entry.example) {
      return GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_WITH_EXAMPLE.replace("{hint}", entry.hint).replace(
        "{example}",
        entry.example,
      );
    }
    return entry.hint;
  }

  // Body present but no specific pattern — still surface a generic format tip.
  if (
    plainBody.length > GMAIL_DEFAULTS.PASSWORD_HINT_FALLBACK_BODY_MIN ||
    (input.snippet || "").length > GMAIL_DEFAULTS.PASSWORD_HINT_FALLBACK_SNIPPET_MIN
  ) {
    return GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK;
  }

  return undefined;
}

export function buildLockedAttachmentMeta(
  msg: Pick<GmailFetchedMessage, "from" | "subject" | "snippet" | "bodyText" | "bodyHtml">,
  filename: string,
): Pick<GmailLockedAttachment, "bankLabel" | "passwordHint" | "subject" | "from"> {
  const subject = msg.subject?.trim() || undefined;
  const from = msg.from?.trim() || undefined;
  const bankLabel =
    detectBankLabel({ from, subject, filename }) || GMAIL_UI_TEXT.IMPORT_GMAIL_BANK_LABEL_FALLBACK;
  const passwordHint =
    inferPasswordHint({
      subject,
      snippet: msg.snippet,
      bodyText: msg.bodyText,
      bodyHtml: msg.bodyHtml,
    }) || GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK;

  return {
    bankLabel,
    passwordHint,
    ...(subject ? { subject } : {}),
    ...(from ? { from } : {}),
  };
}

/**
 * Ensure every locked queue item has a bank chip label and password-format hint.
 * Older sessionStorage entries often lack these fields after schema upgrades.
 */
function bankDefaultPasswordHint(bankLabel: string): string | undefined {
  const entry = BANK_PASSWORD_HINT_DEFAULTS[bankLabel];
  if (!entry) return undefined;
  return GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_WITH_EXAMPLE.replace("{hint}", entry.hint).replace(
    "{example}",
    entry.example,
  );
}

export function backfillLockedAttachmentMeta(item: GmailLockedAttachment): GmailLockedAttachment {
  const bankLabel =
    item.bankLabel ||
    detectBankLabel({
      from: item.from,
      subject: item.subject,
      filename: item.filename,
    }) ||
    GMAIL_UI_TEXT.IMPORT_GMAIL_BANK_LABEL_FALLBACK;

  const isGenericHint =
    !item.passwordHint || item.passwordHint === GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK;
  const passwordHint =
    (!isGenericHint ? item.passwordHint : undefined) ||
    bankDefaultPasswordHint(bankLabel) ||
    item.passwordHint ||
    GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK;

  if (bankLabel === item.bankLabel && passwordHint === item.passwordHint) {
    return item;
  }

  return {
    ...item,
    bankLabel,
    passwordHint,
  };
}
