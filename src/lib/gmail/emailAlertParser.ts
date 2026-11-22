/**
 * Parser for instant bank and credit-card transaction alert emails.
 * Handles Indian banks (HDFC, ICICI, SBI, Axis, Kotak, AMEX, UPI).
 */

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@constants";

import { resolveCategoryName } from "@utils/categoryNormalize";
import { todayStorage, toStorageDate } from "@utils/dateUtils";
import {
  applyKnownUpiPayeeCategory,
  categorizeTransaction,
} from "@utils/transactionCategorization";

import { parseStatementWithAi } from "@/lib/statement/aiParse";
import type { ParsedStatementTransaction } from "@/lib/statement/types";
import type { PaymentMode, TransactionType } from "@/types";

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

function parseDate(emailDateStr?: string): string {
  // Local calendar day (via toStorageDate) — avoid UTC shift that moves IST evenings
  // into the next month (e.g. 31 Oct evening → 1 Nov UTC).
  if (emailDateStr) {
    const stored = toStorageDate(emailDateStr);
    if (stored) return stored;
  }
  return todayStorage();
}

function normalizeAmount(val: string): number {
  return Math.abs(parseFloat(val.replace(/,/g, "")) || 0);
}

/**
 * Clean merchant or payee name from messy bank alert text.
 */
function cleanMerchantName(raw: string): string {
  let text = raw.trim();
  // Strip trailing punctuation and common artifacts
  text = text.replace(/^[.\-,\s:]+|[.\-,\s:]+$/g, "");
  // Remove "at" or "to" prefixes if captured
  text = text.replace(/^(?:at|to|towards|for)\s+/i, "");
  // Strip common trailing words like "on", "dated", "ref"
  text = text.replace(/\s+(?:on|dated|ref|txn|avl|bal).*$/i, "");
  // Limit length
  return text.slice(0, 80).trim() || "Unknown Merchant";
}

/**
 * Infer income vs expense from alert wording.
 * Prefer debit when both appear — UPI alerts often say "debited … credited to merchant".
 */
function inferAlertType(fullText: string): TransactionType {
  const hasDebit =
    /\b(?:is\s+)?debited\b|\bspent\b|\bwithdrawn\b|\bcharged\b|\bpurchase\s+of\b|\bpaid\s+(?:via|to|using|for)\b|\bused\s+(?:for|at)\b|\btransaction\s+of\b/i.test(
      fullText,
    );
  const hasCredit =
    /\b(?:is\s+)?credited(?:\s+(?:with|by|to\s+your))?\b|\bdeposited\b|\brefund(?:ed)?\b|\breversed\b|\breceived\s+(?:INR|Rs\.?|₹)/i.test(
      fullText,
    );

  if (hasDebit) return "expense";
  if (hasCredit) return "income";
  return "expense";
}

function inferAlertPaymentMode(fullText: string): PaymentMode {
  if (/upi|vpa|google\s*pay|gpay|phonepe|paytm/i.test(fullText)) {
    return "UPI";
  }
  // CC alerts: "spent on Credit Card", "HDFC Bank Credit Card ending", Amex/OneCard/Slice
  if (
    /credit\s*card|amex|american\s*express|onecard|uni\s*card|slice\s*card|\bcc\s*xx|\bcard\s*ending|\bpos\s*purchase/i.test(
      fullText,
    )
  ) {
    return "Card";
  }
  if (/debit\s*card/i.test(fullText)) {
    return "Card";
  }
  if (/net\s*banking|neft|rtgs|imps/i.test(fullText)) {
    return "Net Banking";
  }
  if (/\bwallet\b|paytm\s*wallet|amazon\s*pay/i.test(fullText)) {
    return "Wallet";
  }
  return "Other";
}

function resolveAlertCategory(merchant: string, type: TransactionType): string {
  const keyword = categorizeTransaction(merchant, type);
  const other = type === "income" ? INCOME_CATEGORIES.OTHER : EXPENSE_CATEGORIES.OTHER;
  const base =
    keyword && keyword.toLowerCase() !== other.toLowerCase()
      ? keyword
      : resolveCategoryName(type, other).category;
  return applyKnownUpiPayeeCategory(merchant, type, base);
}

/**
 * Fast regex parser for typical Indian transaction alert emails.
 */
export function parseAlertEmailRegex(
  subject: string,
  bodyText: string,
  emailDate?: string,
): ParsedStatementTransaction | null {
  const fullText = `${subject} ${bodyText}`;

  // Check if this looks like a transaction email at all
  const isTxn =
    /debited|credited|spent|withdrawn|transferred|transaction\s*alert|paid\s*via|charged|purchase\s*of/i.test(
      fullText,
    );
  if (!isTxn) return null;

  const type = inferAlertType(fullText);
  const paymentMode = inferAlertPaymentMode(fullText);

  // Extract amount — Matches: INR 1,234.50, Rs. 1,234, Rs 1234, etc.
  const amountMatch = fullText.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;

  const amount = normalizeAmount(amountMatch[1]);
  if (amount <= 0) return null;

  // Extract merchant / payee
  const merchantMatch =
    fullText.match(
      /(?:at|to|towards|for|info:)\s+([A-Za-z0-9\s\-&.'_]{2,40}?)(?:\s+(?:on|dated|ref|avl|bal|using|via|through|\.))/i,
    ) || fullText.match(/VPA\s+([A-Za-z0-9.\-_@]+)/i);

  const merchant = merchantMatch
    ? cleanMerchantName(merchantMatch[1])
    : cleanMerchantName(subject.replace(/transaction\s*alert|bank|alert|hdfc|icici|sbi/gi, ""));

  const date = parseDate(emailDate);
  const category = resolveAlertCategory(merchant, type);

  return {
    title: merchant,
    amount,
    type,
    category,
    paymentMode,
    date,
    isRecurring: false,
    imported: true,
    description: merchant,
    mode: paymentMode,
  };
}

/**
 * Master parser: tries fast regex first, then falls back to Gemini AI parser.
 */
export async function parseEmailAlert(
  subject: string,
  bodyHtml: string,
  bodyText: string,
  emailDate?: string,
): Promise<ParsedStatementTransaction[]> {
  const plainText = bodyText.trim() || cleanHtmlToText(bodyHtml);
  if (!plainText) return [];

  // 1. Try fast local regex
  const regexResult = parseAlertEmailRegex(subject, plainText, emailDate);
  if (regexResult) {
    return [regexResult];
  }

  // 2. If it mentions money or debits/credits but regex missed, use Gemini AI parser
  if (/(?:INR|Rs\.?|₹|\bdebited\b|\bcredited\b|\bstatement\b)/i.test(plainText)) {
    try {
      const promptSnippet = `Subject: ${subject}\nDate: ${emailDate || ""}\nBody:\n${plainText.slice(0, 2000)}`;
      const aiResults = await parseStatementWithAi(promptSnippet);
      if (aiResults && aiResults.length > 0) {
        return aiResults;
      }
    } catch {
      // Ignore AI parsing errors in alert loop
    }
  }

  return [];
}
