import { ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

export type GeminiJsonResult = unknown;

const DEFAULT_TIMEOUT_MS = 25_000;

/** In-flight dedupe for identical Gemini prompts (suggest-category / assistant). */
const inflight = new Map<string, Promise<GeminiJsonResult>>();

function resolveGoogleApiKey(): string | null {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || null;
}

export function getGeminiApiKey(): string {
  const key = resolveGoogleApiKey();
  if (!key) throw new Error(ERROR_MESSAGES.AI_API_KEY_MISSING);
  return key;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(resolveGoogleApiKey());
}

export interface GeminiGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  /** Deduplication key; defaults to prompt hash-ish prefix. */
  dedupeKey?: string;
  timeoutMs?: number;
  model?: string;
  /** When true, ask Gemini for JSON mime type. */
  json?: boolean;
}

/**
 * Shared Gemini generateContent client with timeout + in-flight dedupe.
 * Server-only.
 */
export async function generateGeminiJson(options: GeminiGenerateOptions): Promise<GeminiJsonResult> {
  const apiKey = getGeminiApiKey();
  const model = options.model ?? STATEMENT_IMPORT.GEMINI_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const dedupeKey = options.dedupeKey ?? `gemini:${model}:${options.prompt.slice(0, 240)}`;

  const existing = inflight.get(dedupeKey);
  if (existing) return existing;

  const job = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const body: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          ...(options.json !== false ? { responseMimeType: "application/json" } : {}),
        },
      };
      if (options.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = (await response.json()) as { error?: { message?: string } };
          if (errBody?.error?.message) detail = errBody.error.message;
        } catch {
          // ignore
        }
        throw new Error(ERROR_MESSAGES.AI_PARSE_FAILED.replace("{message}", detail));
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

      if (options.json === false) {
        return content;
      }

      try {
        return JSON.parse(content) as GeminiJsonResult;
      } catch {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        if (start >= 0 && end > start) {
          return JSON.parse(content.slice(start, end + 1)) as GeminiJsonResult;
        }
        throw new Error(ERROR_MESSAGES.AI_PARSE_INVALID_JSON);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("AI_REQUEST_TIMEOUT");
      }
      throw err;
    } finally {
      clearTimeout(timer);
      inflight.delete(dedupeKey);
    }
  })();

  inflight.set(dedupeKey, job);
  return job;
}

/** Plain-text Gemini reply (assistant chat). */
export async function generateGeminiText(options: Omit<GeminiGenerateOptions, "json">): Promise<string> {
  const result = await generateGeminiJson({ ...options, json: false });
  return String(result ?? "").trim();
}

/** Generic timeout wrapper for any promise. */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutCode = "AI_REQUEST_TIMEOUT",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** In-flight dedupe for identical async work by key. */
export function dedupeAsync<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const job = factory().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, job as Promise<GeminiJsonResult>);
  return job;
}
