import { STITCH_DARK_COLORS } from "@constants";

/** Theme preference storage + Stitch dark token helpers. */
export const THEME_STORAGE_KEY = "budgety.theme";

export const SYSTEM_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Re-export: single source of truth lives in `@constants`. */
export { STITCH_DARK_COLORS };

/**
 * SVG / Recharts colors that follow CSS theme tokens
 * (swap automatically with `html.dark`).
 */
export const CHART_THEME_COLORS = {
  GRID: "var(--color-outline-variant)",
  GRID_SOFT: "var(--color-surface-high)",
  TICK: "var(--color-outline)",
  PRIMARY: "var(--color-primary)",
  /** Mid-tone fill — `primary-soft` is a surface tint and washes out on dark charts. */
  PRIMARY_SOFT: "var(--color-primary-muted)",
  PRIMARY_CONTAINER: "var(--color-primary-container)",
  INCOME: "var(--color-income)",
  EXPENSE: "var(--color-expense)",
  TERTIARY: "var(--color-tertiary)",
  DOT_STROKE: "var(--color-card)",
  MUTED_BAR: "var(--color-surface-high)",
  /** Visible stroke on soft chart fills for WCAG graphical contrast. */
  SEGMENT_STROKE: "var(--color-outline-variant)",
} as const;

export function resolveThemePreference(
  preference: ThemePreference,
  systemDark = false,
): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

/** OS dark preference via `prefers-color-scheme`. */
export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(SYSTEM_COLOR_SCHEME_QUERY).matches;
}

/**
 * Subscribe to OS color-scheme changes.
 * Supports modern `addEventListener` and legacy `addListener`.
 */
export function subscribeSystemPrefersDark(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const mq = window.matchMedia(SYSTEM_COLOR_SCHEME_QUERY);
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }
  mq.addListener(onChange);
  return () => mq.removeListener(onChange);
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // ignore
  }
  return "system";
}

export function writeStoredThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;
}
