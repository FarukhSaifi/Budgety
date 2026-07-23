import { NextResponse } from "next/server";

import { DISPLAY_LIMITS, ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import { generateGeminiText, hasGeminiApiKey } from "@/lib/ai/geminiClient";
import { buildAssistantSystemPrompt, formatSnapshotForPrompt, type FinanceSnapshot } from "@/lib/assistant/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface AssistantBody {
  message?: unknown;
  consent?: unknown;
  snapshot?: FinanceSnapshot | null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    let body: AssistantBody;
    try {
      body = (await request.json()) as AssistantBody;
    } catch {
      return jsonError(ERROR_MESSAGES.ASSISTANT_BAD_REQUEST, 400);
    }

    if (!body.consent) {
      return jsonError(ERROR_MESSAGES.ASSISTANT_CONSENT_REQUIRED, 403);
    }

    const message = String(body.message ?? "").trim();
    if (!message) {
      return jsonError(ERROR_MESSAGES.ASSISTANT_EMPTY_MESSAGE, 400);
    }
    if (message.length > DISPLAY_LIMITS.ASSISTANT_MAX_MESSAGE_CHARS) {
      return jsonError(ERROR_MESSAGES.ASSISTANT_MESSAGE_TOO_LONG, 400);
    }

    if (!hasGeminiApiKey()) {
      return jsonError(ERROR_MESSAGES.AI_API_KEY_MISSING, 503);
    }

    const snapshotJson = formatSnapshotForPrompt(body.snapshot ?? {});
    const reply = await generateGeminiText({
      prompt: `FinanceSnapshot:\n${snapshotJson}\n\nUser question: ${message}`,
      systemInstruction: buildAssistantSystemPrompt(),
      temperature: 0.4,
      model: STATEMENT_IMPORT.GEMINI_MODEL,
      timeoutMs: 30_000,
      dedupeKey: `assistant:${message.slice(0, 120)}:${snapshotJson.slice(0, 200)}`,
    });

    if (!reply) {
      return jsonError(ERROR_MESSAGES.ASSISTANT_EMPTY_REPLY, 502);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : ERROR_MESSAGES.ASSISTANT_FAILED;
    if (message === "AI_REQUEST_TIMEOUT" || message === ERROR_MESSAGES.ASSISTANT_TIMEOUT) {
      return jsonError(ERROR_MESSAGES.ASSISTANT_TIMEOUT, 504);
    }
    if (message === ERROR_MESSAGES.AI_API_KEY_MISSING) {
      return jsonError(message, 503);
    }
    return jsonError(ERROR_MESSAGES.ASSISTANT_FAILED, 500);
  }
}
