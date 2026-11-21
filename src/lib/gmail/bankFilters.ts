/**
 * Bank senders, statement query patterns, and keyword rules for Indian banks & credit cards.
 */

export interface BankSenderPattern {
  bank: string;
  senders: string[];
  alertSubjects: string[];
  statementSubjects: string[];
}

export const INDIAN_BANK_PATTERNS: BankSenderPattern[] = [
  {
    bank: "HDFC Bank",
    senders: [
      "alerts@hdfcbank.net",
      "creditcardservices@hdfcbank.com",
      "donotreply@hdfcbank.com",
      "netbanking@hdfcbank.bank.in",
    ],
    alertSubjects: ["debited", "credited", "alert", "transaction", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "ICICI Bank",
    senders: [
      "credit_cards@icicibank.com",
      "alerts@icicibank.com",
      "statements@icicibank.com",
      "ebills@icicibank.com",
      "customercare@icicibank.com",
    ],
    alertSubjects: ["transaction alert", "debited", "credited", "payment of inr", "used for"],
    statementSubjects: ["statement", "e-statement", "estatement", "credit card statement"],
  },
  {
    bank: "State Bank of India (SBI)",
    senders: [
      "donotreply@sbi.co.in",
      "alerts@sbi.co.in",
      "Feedback@sbicard.com",
      "estatement@sbicard.com",
      "statements@sbicard.com",
    ],
    alertSubjects: ["debited", "credited", "txn", "spent", "transaction alert"],
    statementSubjects: ["e-statement", "statement", "monthly statement"],
  },
  {
    bank: "Axis Bank",
    senders: ["alerts@axisbank.com", "estatement@axisbank.com", "creditcards@axisbank.com"],
    alertSubjects: ["transaction alert", "debited", "credited", "spent"],
    statementSubjects: ["statement", "e-statement", "estatement"],
  },
  {
    bank: "Kotak Mahindra Bank",
    senders: ["service.kotak@kotak.com", "statements@kotak.com", "alerts@kotak.com"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement", "credit card statement"],
  },
  {
    bank: "American Express (AMEX)",
    senders: ["AmericanExpress@welcome.aexp.com", "amex@americanexpress.com"],
    alertSubjects: ["transaction alert", "charge", "approved", "processed"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "IndusInd Bank",
    senders: ["reachus@indusind.com", "alerts@indusind.com"],
    alertSubjects: ["debited", "credited", "transaction alert"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "IDFC FIRST Bank",
    senders: ["alerts@idfcfirstbank.com", "statement@idfcfirstbank.com"],
    alertSubjects: ["debited", "credited", "transaction alert", "spent"],
    statementSubjects: ["statement", "e-statement"],
  },
  {
    bank: "OneCard",
    senders: ["alerts@onecard.co.in", "statements@onecard.co.in"],
    alertSubjects: ["transaction alert", "spent", "authorised"],
    statementSubjects: ["monthly statement", "statement"],
  },
];

function formatGmailDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

/**
 * Builds an optimized search query for the Gmail API.
 * Supports date ranges (startDate, endDate, daysBack).
 * e.g., (from:alerts@hdfcbank.net ...) after:2026/01/01 before:2026/02/01
 */
export function buildGmailBankQuery(options?: {
  daysBack?: number;
  startDate?: string;
  endDate?: string;
  fromDate?: Date;
  includeAlerts?: boolean;
  includeStatements?: boolean;
}): string {
  const dateClauses: string[] = [];

  if (options?.startDate) {
    const parsedStart = new Date(options.startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      dateClauses.push(`after:${formatGmailDate(parsedStart)}`);
    }
  } else if (options?.fromDate) {
    dateClauses.push(`after:${formatGmailDate(options.fromDate)}`);
  } else {
    const days = options?.daysBack ?? 30;
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

  const allSenders = INDIAN_BANK_PATTERNS.flatMap((b) => b.senders);
  const senderClause = allSenders.map((s) => `from:${s}`).join(" OR ");

  const subjectKeywords = [
    "statement",
    "debited",
    "credited",
    "spent",
    "transaction",
    '"credit card"',
    "INR",
    "Rs.",
    "e-statement",
  ];
  const subjectClause = subjectKeywords.map((k) => `subject:${k}`).join(" OR ");

  // Also catch generic emails that have PDF attachments with "statement" in filename
  const attachmentClause = "filename:pdf (statement OR bill OR invoice OR transaction)";

  const dateFilterStr = dateClauses.join(" ");
  return `(${senderClause} OR (${subjectClause}) OR (${attachmentClause})) ${dateFilterStr}`.trim();
}
