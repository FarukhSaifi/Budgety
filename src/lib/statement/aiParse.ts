import {
  ERROR_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  STATEMENT_IMPORT,
  TRANSACTION_MODES,
} from "@constants";

import { PAYMENT_MODES_LIST } from "@constants/firestore";

import { builtInCategoriesForType, resolveCategoryName } from "@utils/categoryNormalize";
import {
  applyKnownUpiPayeeCategory,
  categorizeTransaction,
  formatKnownUpiPayeePromptRules,
} from "@utils/transactionCategorization";

import { truncateForAi } from "@/lib/statement/extractText";
import type { ParsedStatementTransaction } from "@/lib/statement/types";
import type { PaymentMode, TransactionType } from "@/types";

const INCOME_LIST = builtInCategoriesForType("income");
const EXPENSE_LIST = builtInCategoriesForType("expense");
const MODE_LIST = Object.values(TRANSACTION_MODES);

type AiProvider = "google" | "openai";

function buildSystemPrompt(): string {
  return [
    "You are a bank-statement parser for a personal finance app called Budgety.",
    "Extract every transaction from the statement text.",
    "Return ONLY valid JSON (no markdown) matching this schema:",
    '{"transactions":[{"title":"string","amount":number,"type":"income"|"expense","category":"string","paymentMode":"string","date":"YYYY-MM-DD"}]}',
    "",
    "Rules:",
    "- amount: positive number only (absolute value).",
    '- type: "income" for credits/deposits; "expense" for debits/withdrawals.',
    '- If narration mentions both debit and credit (e.g. UPI "debited … credited to merchant"), type is expense.',
    "- category: Prefer an existing category from the lists below when it fits well.",
    "- You MAY invent a short Title Case category (2–4 words max) when none of the lists fit.",
    "- Do NOT invent vague labels like Misc or General when a specific merchant category is clear.",
    '- Category "Credit Card" is ONLY for bank-account payments toward a credit-card bill (CRED, bil/onl, payment to card). Ordinary card purchases use the merchant category (Dining Out, Shopping, etc.) with paymentMode=Card.',
    "- Credit-card statement purchases = expense + paymentMode Card. CC payment received / refund on the card statement = income (or refund).",
    `  Income categories: ${INCOME_LIST.join(", ")}`,
    `  Expense categories: ${EXPENSE_LIST.join(", ")}`,
    formatKnownUpiPayeePromptRules(),
    `- paymentMode: MUST be exactly one of: ${MODE_LIST.join(", ")}`,
    "- date: ISO date YYYY-MM-DD. Prefer DD-MM-YYYY / DD.MM.YYYY interpretation for Indian statements.",
    "- title: concise merchant/narration (max ~120 chars). Prefer clean human-readable text.",
    "- Infer category from the description (e.g. Zomato → Dining Out, salary credit → Salary, UPI to petrol → Transportation).",
    "- Infer paymentMode from narration codes (UPI, NEFT, IMPS, RTGS, CARD, POS, etc.). Default to Other if unclear.",
    "- Skip opening/closing balance rows, headers, summaries, and non-transaction lines.",
    '- If nothing can be extracted, return {"transactions":[]}.',
  ].join("\n");
}

function normalizePaymentMode(value: unknown): PaymentMode {
  const raw = String(value ?? "Other").trim();
  const match = PAYMENT_MODES_LIST.find((m) => m.toLowerCase() === raw.toLowerCase());
  return (match ?? "Other") as PaymentMode;
}

function normalizeCategory(type: TransactionType, value: unknown): string {
  return resolveCategoryName(type, value).category;
}

function normalizeDate(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const m = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function coerceTransactions(raw: unknown): ParsedStatementTransaction[] {
  if (!raw || typeof raw !== "object") return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { transactions?: unknown }).transactions)
      ? (raw as { transactions: unknown[] }).transactions
      : [];

  const out: ParsedStatementTransaction[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? row.description ?? "").trim();
    const amount = Math.abs(Number(row.amount) || 0);
    const type: TransactionType = String(row.type).toLowerCase() === "income" ? "income" : "expense";
    const date = normalizeDate(row.date);
    if (!title || !date || amount <= 0) continue;

    const paymentMode = normalizePaymentMode(row.paymentMode ?? row.mode);
    let category = normalizeCategory(type, row.category);
    const other = type === "income" ? INCOME_CATEGORIES.OTHER : EXPENSE_CATEGORIES.OTHER;
    // Keyword fallback when the model returns vague Other — same rules as Excel import.
    if (!category || category.toLowerCase() === other.toLowerCase()) {
      category = categorizeTransaction(title, type);
    }
    category = applyKnownUpiPayeeCategory(title, type, category);

    out.push({
      title,
      description: title,
      amount: Number(amount.toFixed(2)),
      type,
      category,
      paymentMode,
      mode: paymentMode,
      date,
      isRecurring: false,
      imported: true,
    });
  }

  return out;
}

function extractJsonPayload(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(ERROR_MESSAGES.AI_PARSE_INVALID_JSON);
  }
}

function resolveGoogleApiKey(): string | null {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || null;
}

function resolveOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function resolveProvider(): { provider: AiProvider; apiKey: string } | null {
  const googleKey = resolveGoogleApiKey();
  if (googleKey) return { provider: "google", apiKey: googleKey };

  const openAiKey = resolveOpenAiApiKey();
  if (openAiKey) return { provider: "openai", apiKey: openAiKey };

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiStatus(status: number): boolean {
  return (STATEMENT_IMPORT.AI_RETRYABLE_HTTP_STATUSES as readonly number[]).includes(status);
}

function geminiModelsToTry(): string[] {
  const primary = STATEMENT_IMPORT.GEMINI_MODEL;
  const fallbacks = STATEMENT_IMPORT.GEMINI_MODEL_FALLBACKS as readonly string[];
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

function throwForGeminiHttpStatus(status: number): never {
  if (status === 429) {
    throw new Error(ERROR_MESSAGES.AI_RATE_LIMITED);
  }
  if (status === 503) {
    throw new Error(ERROR_MESSAGES.AI_UNAVAILABLE);
  }
  // Status only — never forward provider response bodies to API clients.
  throw new Error(ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", `HTTP ${status}`));
}

type GeminiAttemptResult =
  | { ok: true; transactions: ParsedStatementTransaction[] }
  | { ok: false; status: number; rotateModel: boolean };

async function attemptGeminiModel(
  model: string,
  apiKey: string,
  statementText: string,
): Promise<GeminiAttemptResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt() }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Parse this bank statement into transactions:\n\n${statementText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            transactions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  amount: { type: "NUMBER" },
                  type: { type: "STRING" },
                  category: { type: "STRING" },
                  paymentMode: { type: "STRING" },
                  date: { type: "STRING" },
                },
                required: ["title", "amount", "type", "category", "paymentMode", "date"],
              },
            },
          },
          required: ["transactions"],
        },
      },
    }),
  });

  if (response.ok) {
    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const content = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new Error(ERROR_MESSAGES.AI_PARSE_EMPTY_RESPONSE);
    }

    const parsed = extractJsonPayload(content);
    return { ok: true, transactions: coerceTransactions(parsed) };
  }

  // Drain body so the socket can reuse; never surface upstream text.
  await response.text().catch(() => undefined);

  // 429 = model/quota exhausted → rotate immediately. 503 = retry same model briefly.
  return {
    ok: false,
    status: response.status,
    rotateModel: response.status === 429 || response.status === 404 || !isRetryableGeminiStatus(response.status),
  };
}

async function parseWithGoogle(statementText: string, apiKey: string): Promise<ParsedStatementTransaction[]> {
  const models = geminiModelsToTry();
  let lastStatus = 0;

  for (const model of models) {
    const maxAttempts = STATEMENT_IMPORT.AI_RETRY_MAX_ATTEMPTS;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await attemptGeminiModel(model, apiKey, statementText);
      if (result.ok) return result.transactions;

      lastStatus = result.status;
      if (result.rotateModel) break;
      if (attempt >= maxAttempts) break;

      const delay =
        STATEMENT_IMPORT.AI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
      await sleep(delay);
    }
  }

  throwForGeminiHttpStatus(lastStatus || 500);
}

/** Map thrown AI parse errors → stable API codes for unlock/parse clients. */
export function classifyAiParseError(err: unknown): {
  code: string;
  message: string;
  status: number;
} | null {
  if (!(err instanceof Error)) return null;
  const message = err.message;

  if (message === ERROR_MESSAGES.AI_RATE_LIMITED || message.includes("HTTP 429")) {
    return {
      code: STATEMENT_IMPORT.AI_ERROR_CODES.RATE_LIMITED,
      message: ERROR_MESSAGES.AI_RATE_LIMITED,
      status: STATEMENT_IMPORT.AI_UNAVAILABLE_HTTP_STATUS,
    };
  }
  if (message === ERROR_MESSAGES.AI_UNAVAILABLE || message.includes("HTTP 503")) {
    return {
      code: STATEMENT_IMPORT.AI_ERROR_CODES.UNAVAILABLE,
      message: ERROR_MESSAGES.AI_UNAVAILABLE,
      status: STATEMENT_IMPORT.AI_UNAVAILABLE_HTTP_STATUS,
    };
  }
  if (message === ERROR_MESSAGES.AI_API_KEY_MISSING) {
    return {
      code: STATEMENT_IMPORT.AI_ERROR_CODES.FAILED,
      message,
      status: 503,
    };
  }
  if (
    message === ERROR_MESSAGES.AI_PARSE_INVALID_JSON ||
    message === ERROR_MESSAGES.AI_PARSE_EMPTY_RESPONSE ||
    message.startsWith(ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", ""))
  ) {
    return {
      code: STATEMENT_IMPORT.AI_ERROR_CODES.FAILED,
      message,
      status: 502,
    };
  }
  return null;
}

async function parseWithOpenAi(statementText: string, apiKey: string): Promise<ParsedStatementTransaction[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: STATEMENT_IMPORT.OPENAI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: `Parse this bank statement into transactions:\n\n${statementText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    // Status only — never forward provider response bodies to API clients.
    throw new Error(
      ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", `HTTP ${response.status}`),
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(ERROR_MESSAGES.AI_PARSE_EMPTY_RESPONSE);
  }

  const parsed = extractJsonPayload(content);
  return coerceTransactions(parsed);
}

/**
 * Send statement text to Google Gemini (preferred) or OpenAI and return
 * normalized transactions. Server-only keys — never call from the client.
 *
 * Provider order:
 * 1. GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY → Gemini Developer API
 * 2. OPENAI_API_KEY → OpenAI chat completions (fallback)
 */
export async function parseStatementWithAi(statementText: string): Promise<ParsedStatementTransaction[]> {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new Error(ERROR_MESSAGES.AI_API_KEY_MISSING);
  }

  const text = truncateForAi(statementText);
  if (!text) {
    throw new Error(ERROR_MESSAGES.STATEMENT_EMPTY_TEXT);
  }

  if (resolved.provider === "google") {
    return parseWithGoogle(text, resolved.apiKey);
  }

  return parseWithOpenAi(text, resolved.apiKey);
}
