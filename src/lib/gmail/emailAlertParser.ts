/**
 * Parser for instant bank and credit-card transaction alert emails.
 * Handles Indian banks (HDFC, ICICI, SBI, Axis, Kotak, AMEX, UPI).
 */

import { resolveCategoryName } from "@utils/categoryNormalize";
import { applyKnownUpiPayeeCategory } from "@utils/transactionCategorization";

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
  if (emailDateStr) {
    const d = new Date(emailDateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
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
    /debited|credited|spent|withdrawn|transferred|transaction\s*alert|paid\s*via|charged|purchase\s*of/i.test(fullText);
  if (!isTxn) return null;

  // Determine income vs expense
  const isCredit = /credited|deposited|refund|reversed|received/i.test(fullText);
  const type: TransactionType = isCredit ? "income" : "expense";

  // Determine payment mode
  let paymentMode: PaymentMode = "Other";
  if (/upi|vpa|googlepay|phonepe|paytm/i.test(fullText)) {
    paymentMode = "UPI";
  } else if (/credit\s*card/i.test(fullText)) {
    paymentMode = "Card";
  } else if (/debit\s*card/i.test(fullText)) {
    paymentMode = "Card";
  } else if (/net\s*banking|neft|rtgs|imps/i.test(fullText)) {
    paymentMode = "Net Banking";
  }

  // Extract amount
  // Matches: INR 1,234.50, Rs. 1,234, Rs 1234, etc.
  const amountMatch = fullText.match(/(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;

  const amount = normalizeAmount(amountMatch[1]);
  if (amount <= 0) return null;

  // Extract merchant / payee
  // Patterns:
  // "debited ... at SWIGGY"
  // "used at AMAZON"
  // "paid to ZOMATO"
  // "vpa user@bank (NAME)"
  const merchantMatch =
    fullText.match(
      /(?:at|to|towards|for|info:)\s+([A-Za-z0-9\s\-&.'_]{2,40}?)(?:\s+(?:on|dated|ref|avl|bal|using|via|through|\.))/i,
    ) || fullText.match(/VPA\s+([A-Za-z0-9.\-_@]+)/i);

  const merchant = merchantMatch
    ? cleanMerchantName(merchantMatch[1])
    : cleanMerchantName(subject.replace(/transaction\s*alert|bank|alert|hdfc|icici|sbi/gi, ""));

  const date = parseDate(emailDate);
  const defaultCategory = resolveCategoryName(type, "Other").category;
  const category = applyKnownUpiPayeeCategory(merchant, type, defaultCategory);

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
