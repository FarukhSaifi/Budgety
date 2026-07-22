import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_TAG_COLOR,
  STITCH_CHART_COLORS,
} from "@constants";

/**
 * Returns "white" or dark gray for text on a given hex background (WCAG contrast).
 */
export function getContrastText(hex: string | null | undefined): string {
  if (!hex || typeof hex !== "string") return "#1f2937";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#1f2937";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? "#1f2937" : "#ffffff";
}

/**
 * Multi-color chart / progress fill for a category (Analytics donut + budget bars).
 * Prefers CATEGORY_COLORS so Analytics and /budgets stay aligned; falls back to
 * STITCH_CHART_COLORS by index for unknown categories.
 */
export function getCategoryChartColor(
  categoryName: string | null | undefined,
  index = 0,
): string {
  const known =
    categoryName &&
    (CATEGORY_COLORS as Record<string, string>)[categoryName];
  if (known && known.toLowerCase() !== DEFAULT_CATEGORY_TAG_COLOR.toLowerCase()) {
    return known;
  }
  return STITCH_CHART_COLORS[Math.abs(index) % STITCH_CHART_COLORS.length];
}

export interface CategoryTagStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Style for a category tag (background + text color) using CATEGORY_COLORS.
 */
export function getCategoryTagStyle(
  categoryName: string | null | undefined,
): CategoryTagStyle {
  const backgroundColor =
    (categoryName &&
      (CATEGORY_COLORS as Record<string, string>)[categoryName]) ||
    DEFAULT_CATEGORY_TAG_COLOR;
  return {
    backgroundColor,
    color: getContrastText(backgroundColor),
  };
}
