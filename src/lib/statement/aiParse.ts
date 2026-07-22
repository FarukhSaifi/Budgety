import {
  ERROR_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  STATEMENT_IMPORT,
  TRANSACTION_MODES,
} from "@constants";
import { PAYMENT_MODES_LIST } from "@constants/firestore";
import type { PaymentMode, TransactionType } from "@/types";
import type { ParsedStatementTransaction } from "@/lib/statement/types";
import { truncateForAi } from "@/lib/statement/extractText";

const INCOME_LIST = Object.values(INCOME_CATEGORIES);
const EXPENSE_LIST = Object.values(EXPENSE_CATEGORIES);
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
    `- category: MUST be exactly one of the allowed lists below based on type.`,
    `  Income categories: ${INCOME_LIST.join(", ")}`,
    `  Expense categories: ${EXPENSE_LIST.join(", ")}`,
    `- paymentMode: MUST be exactly one of: ${MODE_LIST.join(", ")}`,
    "- date: ISO date YYYY-MM-DD. Prefer DD-MM-YYYY / DD.MM.YYYY interpretation for Indian statements.",
    "- title: concise merchant/narration (max ~120 chars). Prefer clean human-readable text.",
    "- Infer category from the description (e.g. Zomato → Dining Out, salary credit → Salary, UPI to petrol → Transportation).",
    "- Infer paymentMode from narration codes (UPI, NEFT, IMPS, RTGS, CARD, etc.). Default to Other if unclear.",
    "- Skip opening/closing balance rows, headers, summaries, and non-transaction lines.",
    '- If nothing can be extracted, return {"transactions":[]}.',
  ].join("\n");
}

function normalizePaymentMode(value: unknown): PaymentMode {
  const raw = String(value ?? "Other").trim();
  const match = PAYMENT_MODES_LIST.find(
    (m) => m.toLowerCase() === raw.toLowerCase(),
  );
  return (match ?? "Other") as PaymentMode;
}

function normalizeCategory(type: TransactionType, value: unknown): string {
  const raw = String(value ?? "Other").trim();
  const allowed = type === "income" ? INCOME_LIST : EXPENSE_LIST;
  const match = allowed.find((c) => c.toLowerCase() === raw.toLowerCase());
  if (match) return match;
  return type === "income" ? INCOME_CATEGORIES.OTHER : EXPENSE_CATEGORIES.OTHER;
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
    const type: TransactionType =
      String(row.type).toLowerCase() === "income" ? "income" : "expense";
    const date = normalizeDate(row.date);
    if (!title || !date || amount <= 0) continue;

    const paymentMode = normalizePaymentMode(row.paymentMode ?? row.mode);
    const category = normalizeCategory(type, row.category);

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
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    null
  );
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

async function parseWithGoogle(
  statementText: string,
  apiKey: string,
): Promise<ParsedStatementTransaction[]> {
  const model = STATEMENT_IMPORT.GEMINI_MODEL;
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
                required: [
                  "title",
                  "amount",
                  "type",
                  "category",
                  "paymentMode",
                  "date",
                ],
              },
            },
          },
          required: ["transactions"],
        },
      },
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as {
        error?: { message?: string };
      };
      if (errBody?.error?.message) detail = errBody.error.message;
    } catch {
      // ignore body parse failure
    }
    throw new Error(
      ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", detail),
    );
  }

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
  return coerceTransactions(parsed);
}

async function parseWithOpenAi(
  statementText: string,
  apiKey: string,
): Promise<ParsedStatementTransaction[]> {
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
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as {
        error?: { message?: string };
      };
      if (errBody?.error?.message) detail = errBody.error.message;
    } catch {
      // ignore body parse failure
    }
    throw new Error(
      ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", detail),
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
export async function parseStatementWithAi(
  statementText: string,
): Promise<ParsedStatementTransaction[]> {
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
