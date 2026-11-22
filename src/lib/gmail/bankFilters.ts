/**
 * Bank senders, statement query patterns, and keyword rules for Indian banks & credit cards.
 *
 * Query strategy (evidence-backed):
 * - Prefer `from:` domain matches so renamed bank noreply addresses are not missed.
 * - Keep exact senders for domains that are too broad alone (e.g. marketing-heavy brands).
 * - Split alert vs statement subject clauses so toggling sources does not crowd maxResults.
 * - Avoid bare `subject:INR` / `subject:Rs.` — those match shopping receipts and OTP mail.
 */

import { GMAIL_DEFAULTS } from "@constants";

export interface BankSenderPattern {
  bank: string;
  /** Short chip label for unlock UI (e.g. HDFC, ICICI). */
  shortLabel: string;
  /** Exact From addresses (legacy + high-signal). */
  senders: string[];
  /** Gmail `from:domain` tokens — catches alerts@ / statements@ variants. */
  domains: string[];
  alertSubjects: string[];
  statementSubjects: string[];
}

export const INDIAN_BANK_PATTERNS: BankSenderPattern[] = [
  {
    bank: "HDFC Bank",
    shortLabel: "HDFC",
    senders: [
      "alerts@hdfcbank.net",
      "alerts@hdfcbank.com",
      "creditcardservices@hdfcbank.com",
      "donotreply@hdfcbank.com",
      "netbanking@hdfcbank.bank.in",
      "estatement@hdfcbank.net",
      "statements@hdfcbank.net",
    ],
    domains: ["hdfcbank.net", "hdfcbank.com", "hdfcbank.bank.in"],
    alertSubjects: ["debited", "credited", "alert", "transaction", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement", "estatement"],
  },
  {
    bank: "ICICI Bank",
    shortLabel: "ICICI",
    senders: [
      "credit_cards@icicibank.com",
      "alerts@icicibank.com",
      "statements@icicibank.com",
      "ebills@icicibank.com",
      "customercare@icicibank.com",
      "estatement@icicibank.com",
      "estatement@icici.bank.in",
    ],
    domains: ["icicibank.com", "icicibank.co.in"],
    alertSubjects: ["transaction alert", "debited", "credited", "payment of inr", "used for"],
    statementSubjects: ["statement", "e-statement", "estatement", "credit card statement"],
  },
  {
    bank: "State Bank of India (SBI)",
    shortLabel: "SBI",
    senders: [
      "donotreply@sbi.co.in",
      "alerts@sbi.co.in",
      "Feedback@sbicard.com",
      "estatement@sbicard.com",
      "statements@sbicard.com",
      "alerts@sbicard.com",
    ],
    domains: ["sbi.co.in", "sbicard.com", "onlinesbi.com", "sbi.com"],
    alertSubjects: ["debited", "credited", "txn", "spent", "transaction alert"],
    statementSubjects: ["e-statement", "statement", "monthly statement", "account statement"],
  },
  {
    bank: "Axis Bank",
    shortLabel: "Axis",
    senders: ["alerts@axisbank.com", "estatement@axisbank.com", "creditcards@axisbank.com", "statements@axisbank.com"],
    domains: ["axisbank.com", "axisbank.co.in"],
    alertSubjects: ["transaction alert", "debited", "credited", "spent"],
    statementSubjects: ["statement", "e-statement", "estatement", "credit card statement"],
  },
  {
    bank: "Kotak Mahindra Bank",
    shortLabel: "Kotak",
    senders: ["service.kotak@kotak.com", "statements@kotak.com", "alerts@kotak.com"],
    domains: ["kotak.com", "kotakbank.com"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "American Express (AMEX)",
    shortLabel: "Amex",
    senders: ["AmericanExpress@welcome.aexp.com", "amex@americanexpress.com", "donotreply@americanexpress.com"],
    // Domains alone are marketing-heavy — still OK when AND'd with statement/alert subjects.
    domains: ["aexp.com", "americanexpress.com", "welcome.aexp.com"],
    alertSubjects: ["transaction alert", "charge", "approved", "processed", "spent"],
    statementSubjects: ["statement", "e-statement", "your statement", "billing statement"],
  },
  {
    bank: "IndusInd Bank",
    shortLabel: "IndusInd",
    senders: ["reachus@indusind.com", "alerts@indusind.com", "estatement@indusind.com"],
    domains: ["indusind.com"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "IDFC FIRST Bank",
    shortLabel: "IDFC",
    senders: ["alerts@idfcfirstbank.com", "statement@idfcfirstbank.com"],
    domains: ["idfcfirstbank.com"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "OneCard",
    shortLabel: "OneCard",
    senders: ["alerts@onecard.co.in", "statements@onecard.co.in"],
    domains: ["onecard.co.in", "getonecard.app"],
    alertSubjects: ["transaction alert", "spent", "authorised"],
    statementSubjects: ["monthly statement", "statement"],
  },
  {
    bank: "Yes Bank",
    shortLabel: "Yes Bank",
    senders: ["alerts@yesbank.in", "estatement@yesbank.in", "creditcards@yesbank.in"],
    domains: ["yesbank.in"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "RBL Bank",
    shortLabel: "RBL",
    senders: ["alerts@rblbank.com", "estatement@rblbank.com", "creditcards@rblbank.com"],
    domains: ["rblbank.com"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "Bank of Baroda",
    shortLabel: "BoB",
    senders: ["alerts@bankofbaroda.com", "donotreply@bankofbaroda.com"],
    domains: ["bankofbaroda.com", "bobcard.co.in"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement", "account statement"],
  },
  {
    bank: "Punjab National Bank",
    shortLabel: "PNB",
    senders: ["alerts@pnb.co.in", "donotreply@pnb.co.in"],
    domains: ["pnb.co.in", "pnbindia.in"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "Canara Bank",
    shortLabel: "Canara",
    senders: ["alerts@canarabank.com", "donotreply@canarabank.com"],
    domains: ["canarabank.com"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "Federal Bank",
    shortLabel: "Federal",
    senders: ["alerts@federalbank.co.in", "estatement@federalbank.co.in"],
    domains: ["federalbank.co.in"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "AU Small Finance Bank",
    shortLabel: "AU Bank",
    senders: ["alerts@aubank.in", "estatement@aubank.in"],
    domains: ["aubank.in", "ausf.in"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "Bandhan Bank",
    shortLabel: "Bandhan",
    senders: ["alerts@bandhanbank.com"],
    domains: ["bandhanbank.com"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "HSBC India",
    shortLabel: "HSBC",
    senders: ["alerts@hsbc.co.in", "estatements@hsbc.co.in"],
    domains: ["hsbc.co.in", "email.hsbc.co.in"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "Standard Chartered",
    shortLabel: "StanChart",
    senders: ["alerts@sc.com", "donotreply.india@sc.com"],
    domains: ["sc.com", "standardchartered.co.in"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "Slice",
    shortLabel: "Slice",
    senders: ["noreply@sliceit.com", "alerts@sliceit.com", "statements@sliceit.com"],
    domains: ["sliceit.com", "slice.bank.in"],
    alertSubjects: ["transaction", "spent", "paid", "alert"],
    statementSubjects: ["statement", "monthly statement"],
  },
  {
    bank: "Uni Cards",
    shortLabel: "Uni",
    senders: ["noreply@uni.cards", "alerts@uni.cards", "statements@uni.cards"],
    domains: ["uni.cards"],
    alertSubjects: ["transaction", "spent", "alert"],
    statementSubjects: ["statement", "monthly statement"],
  },
];

/** Shared subject tokens for instant debit/credit alerts (AND'd with bank from:). */
export const GMAIL_ALERT_SUBJECT_KEYWORDS = [
  "debited",
  "credited",
  "spent",
  "transaction alert",
  '"txn alert"',
  "payment alert",
  "purchase alert",
  "charge alert",
  "used for",
  "withdrawn",
] as const;

/**
 * Shared subject tokens for e-statements / CC bills (AND'd with bank from:).
 * Includes credit-card wording so CC PDFs are not missed when senders differ.
 */
export const GMAIL_STATEMENT_SUBJECT_KEYWORDS = [
  "statement",
  "e-statement",
  "estatement",
  '"e statement"',
  '"credit card statement"',
  '"card statement"',
  '"account statement"',
  '"billing statement"',
  '"monthly statement"',
  "ebill",
  "e-bill",
] as const;

function formatGmailDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function orClause(parts: string[]): string {
  const unique = [...new Set(parts.filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  return `(${unique.join(" OR ")})`;
}

function subjectOrClause(keywords: readonly string[]): string {
  return orClause(keywords.map((k) => `subject:${k}`));
}

/**
 * Builds an optimized search query for the Gmail API.
 * Supports date ranges (startDate, endDate, daysBack) and alert/statement toggles.
 * e.g., (from:hdfcbank.net subject:(statement OR debited) ...) after:2026/01/01
 */
export function buildGmailBankQuery(options?: {
  daysBack?: number;
  startDate?: string;
  endDate?: string;
  fromDate?: Date;
  includeAlerts?: boolean;
  includeStatements?: boolean;
}): string {
  const includeAlerts = options?.includeAlerts !== false;
  const includeStatements = options?.includeStatements !== false;

  const dateClauses: string[] = [];

  if (options?.startDate) {
    const parsedStart = new Date(options.startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      dateClauses.push(`after:${formatGmailDate(parsedStart)}`);
    }
  } else if (options?.fromDate) {
    dateClauses.push(`after:${formatGmailDate(options.fromDate)}`);
  } else {
    // Default window must cover a full monthly statement cycle (issue day + late delivery).
    const days = options?.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    dateClauses.push(`after:${formatGmailDate(cutoff)}`);
  }

  if (options?.endDate) {
    const parsedEnd = new Date(options.endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      // Advance by 1 day because Gmail "before:" is exclusive
      const nextDay = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000);
      dateClauses.push(`before:${formatGmailDate(nextDay)}`);
    }
  }

  // Domains alone cover renamed noreply addresses; listing every exact sender
  // also balloons the query past Gmail’s practical length limit.
  const domains = INDIAN_BANK_PATTERNS.flatMap((b) => b.domains);
  const fromClause = orClause(domains.map((d) => `from:${d}`));

  const contentClauses: string[] = [];

  if (includeAlerts) {
    contentClauses.push(subjectOrClause(GMAIL_ALERT_SUBJECT_KEYWORDS));
  }

  if (includeStatements) {
    contentClauses.push(subjectOrClause(GMAIL_STATEMENT_SUBJECT_KEYWORDS));
    // Filename-only PDF catch for bank-branded attachments that omit statement subjects.
    // Kept narrow (statement/bill/e-statement) to avoid random PDF invoices.
    contentClauses.push('filename:pdf (statement OR estatement OR e-statement OR "credit card" OR ebill OR bill)');
  }

  // If both sources disabled (shouldn't happen in UI), fall back to statements.
  const contentOr =
    contentClauses.length > 0 ? orClause(contentClauses) : subjectOrClause(GMAIL_STATEMENT_SUBJECT_KEYWORDS);

  // Bank from: AND (alerts OR statements OR statement PDFs).
  // This avoids matching unrelated "transaction" / "statement" mail from non-banks.
  const dateFilterStr = dateClauses.join(" ");
  return `${fromClause} ${contentOr} ${dateFilterStr}`.trim();
}
