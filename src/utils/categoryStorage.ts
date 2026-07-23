import { firestoreApi } from "@/lib/firestore";
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

/** Read legacy user-added categories from localStorage (migration only). */
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

function clearPersistedCategories(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

/**
 * One-time migration: push legacy localStorage custom categories into Firestore,
 * then clear the device-local key. Safe to call repeatedly.
 */
export async function migrateLocalCategoriesToFirestore(userId: string): Promise<void> {
  const local = loadPersistedCategories(userId);
  if (!local) return;

  const existing = await firestoreApi.fetchCategories(userId);
  const existingKeys = new Set(existing.map((c) => `${c.type}:${c.name.toLowerCase()}`));
  const createdAt = new Date().toISOString();
  const toAdd: Array<{
    userId: string;
    name: string;
    type: "income" | "expense";
    color: string;
    isDefault: boolean;
    createdAt: string;
  }> = [];

  for (const name of local.income) {
    const key = `income:${name.toLowerCase()}`;
    if (existingKeys.has(key)) continue;
    toAdd.push({
      userId,
      name,
      type: "income",
      color: "#95a5a6",
      isDefault: false,
      createdAt,
    });
  }
  for (const name of local.expense) {
    const key = `expense:${name.toLowerCase()}`;
    if (existingKeys.has(key)) continue;
    toAdd.push({
      userId,
      name,
      type: "expense",
      color: "#95a5a6",
      isDefault: false,
      createdAt,
    });
  }

  if (toAdd.length > 0) {
    await firestoreApi.addCategoriesBulk(toAdd);
  }
  clearPersistedCategories(userId);
}
