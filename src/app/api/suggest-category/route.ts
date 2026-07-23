import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "@constants";

import { dedupeAsync, withTimeout } from "@/lib/ai/geminiClient";
import { suggestCategoryWithAi, type SuggestCategoryResult } from "@/lib/category/suggestCategory";
import type { TransactionType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SuggestCategoryBody {
  title?: unknown;
  amount?: unknown;
  typeHint?: unknown;
  existingCategories?: {
    income?: unknown;
    expense?: unknown;
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

function cacheKey(title: string, amount: number | undefined, typeHint: string | undefined): string {
  return `${typeHint ?? "any"}|${amount ?? ""}|${title.toLowerCase()}`;
}

/** Short-lived in-memory cache for identical suggest-category requests on this instance. */
const RESULT_CACHE = new Map<string, { at: number; value: SuggestCategoryResult }>();
const CACHE_TTL_MS = 60_000;

export async function POST(request: Request) {
  try {
    let body: SuggestCategoryBody;
    try {
      body = (await request.json()) as SuggestCategoryBody;
    } catch {
      return jsonError(ERROR_MESSAGES.SUGGEST_CATEGORY_TITLE_REQUIRED, 400);
    }

    const title = String(body.title ?? "").trim();
    if (!title) {
      return jsonError(ERROR_MESSAGES.SUGGEST_CATEGORY_TITLE_REQUIRED, 400);
    }

    const amountRaw = Number(body.amount);
    const amount = Number.isFinite(amountRaw) ? Math.abs(amountRaw) : undefined;

    const typeHintRaw = String(body.typeHint ?? "").toLowerCase();
    const typeHint: TransactionType | undefined =
      typeHintRaw === "income" || typeHintRaw === "expense" ? typeHintRaw : undefined;

    const key = cacheKey(title, amount, typeHint);
    const cached = RESULT_CACHE.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json(cached.value, {
        headers: {
          "Cache-Control": "private, max-age=60",
          "X-Budgety-Cache": "HIT",
        },
      });
    }

    const existingCategories = {
      income: asStringList(body.existingCategories?.income),
      expense: asStringList(body.existingCategories?.expense),
    };

    const result: SuggestCategoryResult = await dedupeAsync(key, () =>
      withTimeout(
        suggestCategoryWithAi({
          title,
          amount,
          typeHint,
          existingCategories,
        }),
      ),
    );

    RESULT_CACHE.set(key, { at: Date.now(), value: result });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=60",
        "X-Budgety-Cache": "MISS",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "AI_REQUEST_TIMEOUT") {
      return jsonError(ERROR_MESSAGES.ASSISTANT_TIMEOUT, 504);
    }
    const status =
      msg === ERROR_MESSAGES.AI_API_KEY_MISSING
        ? 503
        : msg === ERROR_MESSAGES.SUGGEST_CATEGORY_TITLE_REQUIRED
          ? 400
          : msg.includes("AI")
            ? 502
            : 500;
    return jsonError(msg || ERROR_MESSAGES.AI_SUGGEST_CATEGORY_FAILED.replace("{message}", "unknown error"), status);
  }
}
