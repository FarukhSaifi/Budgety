import { UI_PERIOD_STORAGE_KEY, VIEW_PERIODS } from "@constants";
import type { ViewPeriod } from "@/types";

export interface PersistedUiPeriod {
  viewPeriod: ViewPeriod;
  selectedMonth: number;
  selectedYear: number;
}

const VALID_PERIODS = new Set<string>(Object.values(VIEW_PERIODS));

function isValidMonth(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidYear(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1970 && value <= 2100;
}

/** Read persisted period from localStorage. Returns null when missing/invalid/SSR. */
export function loadPersistedUiPeriod(): PersistedUiPeriod | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UI_PERIOD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedUiPeriod>;
    if (!parsed || !VALID_PERIODS.has(String(parsed.viewPeriod))) return null;
    const selectedMonth = Number(parsed.selectedMonth);
    const selectedYear = Number(parsed.selectedYear);
    if (!isValidMonth(selectedMonth) || !isValidYear(selectedYear)) return null;
    return {
      viewPeriod: parsed.viewPeriod as ViewPeriod,
      selectedMonth,
      selectedYear,
    };
  } catch {
    return null;
  }
}

/** Persist period selection so import focus survives refresh. */
export function savePersistedUiPeriod(period: PersistedUiPeriod): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_PERIOD_STORAGE_KEY, JSON.stringify(period));
  } catch {
    // Quota / private mode — ignore; in-memory period still works for the session.
  }
}
