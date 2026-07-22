import type { TransactionType } from "@/types";

export interface SuggestCategoryResponse {
  category: string;
  type: TransactionType;
  confidence: number;
}

export interface SuggestCategoryClientInput {
  title: string;
  amount?: number;
  typeHint?: TransactionType;
  existingCategories?: {
    income?: string[];
    expense?: string[];
  };
}

export type SuggestCategoryClientResult =
  | { ok: true; data: SuggestCategoryResponse }
  | { ok: false; status: number; error: string; unavailable?: boolean };

/**
 * Client helper for `POST /api/suggest-category`.
 * Returns a structured result so UI can fall back to manual create.
 */
export async function requestCategorySuggestion(
  input: SuggestCategoryClientInput,
): Promise<SuggestCategoryClientResult> {
  const title = String(input.title ?? "").trim();
  if (!title) {
    return { ok: false, status: 400, error: "Title required" };
  }

  try {
    const res = await fetch("/api/suggest-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: input.amount,
        typeHint: input.typeHint,
        existingCategories: input.existingCategories,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      category?: string;
      type?: string;
      confidence?: number;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: payload.error || `HTTP ${res.status}`,
        unavailable: res.status === 503,
      };
    }

    const type =
      payload.type === "income" || payload.type === "expense"
        ? payload.type
        : input.typeHint ?? "expense";
    const category = String(payload.category ?? "").trim();
    if (!category) {
      return {
        ok: false,
        status: 502,
        error: "Invalid suggestion",
      };
    }

    return {
      ok: true,
      data: {
        category,
        type,
        confidence:
          typeof payload.confidence === "number" ? payload.confidence : 0.5,
      },
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
