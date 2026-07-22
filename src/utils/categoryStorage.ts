import type { CategoryState } from "@/types";

/** localStorage key prefix; full key is `budgety.categories.{userId}`. */
export const CATEGORIES_STORAGE_KEY_PREFIX = "budgety.categories.";

function storageKey(userId: string): string {
  return `${CATEGORIES_STORAGE_KEY_PREFIX}${userId}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function normalizeList(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const name = String(raw ?? "").trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Read user-added categories from localStorage. Returns null when missing/invalid/SSR. */
export function loadPersistedCategories(userId: string): CategoryState | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CategoryState>;
    if (!parsed || !isStringArray(parsed.income) || !isStringArray(parsed.expense)) {
      return null;
    }
    return {
      income: normalizeList(parsed.income),
      expense: normalizeList(parsed.expense),
    };
  } catch {
    return null;
  }
}

/** Persist user-added categories so custom names survive refresh (device-local). */
export function savePersistedCategories(
  userId: string,
  categories: CategoryState,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const payload: CategoryState = {
      income: normalizeList(categories.income ?? []),
      expense: normalizeList(categories.expense ?? []),
    };
    window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; in-memory categories still work for the session.
  }
}
