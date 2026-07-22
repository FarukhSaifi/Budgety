import {
  ERROR_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  STATEMENT_IMPORT,
} from "@constants";
import type { TransactionType } from "@/types";

const INCOME_LIST = Object.values(INCOME_CATEGORIES) as string[];
const EXPENSE_LIST = Object.values(EXPENSE_CATEGORIES) as string[];

export interface SuggestCategoryRequest {
  title: string;
  amount?: number;
  typeHint?: TransactionType;
  /** Extra custom category names the model may reuse. */
  existingCategories?: {
    income?: string[];
    expense?: string[];
  };
}

export interface SuggestCategoryResult {
  category: string;
  type: TransactionType;
  confidence: number;
}

type AiProvider = "google" | "openai";

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

function buildPrompt(input: SuggestCategoryRequest): string {
  const incomeExtras = (input.existingCategories?.income ?? []).filter(Boolean);
  const expenseExtras = (input.existingCategories?.expense ?? []).filter(Boolean);
  const incomeAll = [...new Set([...INCOME_LIST, ...incomeExtras])];
  const expenseAll = [...new Set([...EXPENSE_LIST, ...expenseExtras])];

  return [
    "You classify a single personal-finance transaction for the Budgety app.",
    "Return ONLY valid JSON matching:",
    '{"category":"string","type":"income"|"expense","confidence":number}',
    "",
    "Rules:",
    '- type: "income" for credits/deposits/refunds received; "expense" for spending/payments.',
    "- Prefer an existing category from the lists below when it fits well.",
    "- You MAY invent a short Title Case category (2–4 words max) when none fit.",
    "- confidence: 0 to 1.",
    input.typeHint
      ? `- Prefer type "${input.typeHint}" unless the title clearly indicates otherwise.`
      : "- Infer type from the title and amount context.",
    "",
    `Income categories: ${incomeAll.join(", ")}`,
    `Expense categories: ${expenseAll.join(", ")}`,
    "",
    `Title: ${input.title}`,
    input.amount != null && Number.isFinite(input.amount)
      ? `Amount: ${input.amount}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
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

function normalizeSuggestion(
  raw: unknown,
  typeHint?: TransactionType,
): SuggestCategoryResult {
  if (!raw || typeof raw !== "object") {
    throw new Error(ERROR_MESSAGES.AI_SUGGEST_CATEGORY_INVALID);
  }
  const row = raw as Record<string, unknown>;
  const category = String(row.category ?? "").trim().replace(/\s+/g, " ");
  if (!category) {
    throw new Error(ERROR_MESSAGES.AI_SUGGEST_CATEGORY_INVALID);
  }

  const rawType = String(row.type ?? "").toLowerCase();
  let type: TransactionType =
    rawType === "income" ? "income" : rawType === "expense" ? "expense" : typeHint ?? "expense";

  if (typeHint === "income" || typeHint === "expense") {
    // Keep locked context unless model is strongly contradictory — prefer hint.
    type = typeHint;
  }

  const confidenceRaw = Number(row.confidence);
  const confidence = Number.isFinite(confidenceRaw)
    ? Math.min(1, Math.max(0, confidenceRaw))
    : 0.5;

  // Prefer canonical casing from known lists.
  const allowed = type === "income" ? INCOME_LIST : EXPENSE_LIST;
  const match = allowed.find((c) => c.toLowerCase() === category.toLowerCase());

  return {
    category: match ?? category,
    type,
    confidence,
  };
}

async function suggestWithGoogle(
  prompt: string,
  apiKey: string,
): Promise<unknown> {
  const model = STATEMENT_IMPORT.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING" },
            type: { type: "STRING" },
            confidence: { type: "NUMBER" },
          },
          required: ["category", "type", "confidence"],
        },
      },
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) detail = errBody.error.message;
    } catch {
      // ignore
    }
    throw new Error(
      ERROR_MESSAGES.AI_SUGGEST_CATEGORY_FAILED.replace("{message}", detail),
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error(ERROR_MESSAGES.AI_PARSE_EMPTY_RESPONSE);
  }

  return extractJsonPayload(content);
}

async function suggestWithOpenAi(
  prompt: string,
  apiKey: string,
): Promise<unknown> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: STATEMENT_IMPORT.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You classify personal finance transactions. Reply with JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as { error?: { message?: string } };
      if (errBody?.error?.message) detail = errBody.error.message;
    } catch {
      // ignore
    }
    throw new Error(
      ERROR_MESSAGES.AI_SUGGEST_CATEGORY_FAILED.replace("{message}", detail),
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(ERROR_MESSAGES.AI_PARSE_EMPTY_RESPONSE);
  }

  return extractJsonPayload(content);
}

/**
 * Suggest a category name + income/expense type from a transaction title.
 * Server-only — uses the same Gemini/OpenAI keys as statement parsing.
 */
export async function suggestCategoryWithAi(
  input: SuggestCategoryRequest,
): Promise<SuggestCategoryResult> {
  const title = String(input.title ?? "").trim();
  if (!title) {
    throw new Error(ERROR_MESSAGES.SUGGEST_CATEGORY_TITLE_REQUIRED);
  }

  const resolved = resolveProvider();
  if (!resolved) {
    throw new Error(ERROR_MESSAGES.AI_API_KEY_MISSING);
  }

  const prompt = buildPrompt({ ...input, title });
  const raw =
    resolved.provider === "google"
      ? await suggestWithGoogle(prompt, resolved.apiKey)
      : await suggestWithOpenAi(prompt, resolved.apiKey);

  return normalizeSuggestion(raw, input.typeHint);
}
