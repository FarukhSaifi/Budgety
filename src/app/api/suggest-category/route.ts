import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "@constants";

import {
  suggestCategoryWithAi,
  type SuggestCategoryResult,
} from "@/lib/category/suggestCategory";
import type { TransactionType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      typeHintRaw === "income" || typeHintRaw === "expense"
        ? typeHintRaw
        : undefined;

    const result: SuggestCategoryResult = await suggestCategoryWithAi({
      title,
      amount,
      typeHint,
      existingCategories: {
        income: asStringList(body.existingCategories?.income),
        expense: asStringList(body.existingCategories?.expense),
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : ERROR_MESSAGES.AI_SUGGEST_CATEGORY_FAILED.replace(
            "{message}",
            "unknown error",
          );
    const status =
      message === ERROR_MESSAGES.AI_API_KEY_MISSING
        ? 503
        : message === ERROR_MESSAGES.SUGGEST_CATEGORY_TITLE_REQUIRED
          ? 400
          : message.includes("AI")
            ? 502
            : 500;
    return jsonError(message, status);
  }
}
