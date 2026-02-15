import { CATEGORY_COLORS, DEFAULT_CATEGORY_TAG_COLOR } from "@constants";

/**
 * Returns "white" or dark gray for text on a given hex background (WCAG contrast).
 * @param {string} hex - e.g. "#3498db"
 * @returns {string} "#ffffff" or "#1f2937"
 */
export function getContrastText(hex) {
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
 * Style for a category tag (background + text color) using CATEGORY_COLORS.
 * @param {string} categoryName - Category name (e.g. "Groceries")
 * @returns {{ backgroundColor: string, color: string }}
 */
export function getCategoryTagStyle(categoryName) {
  const backgroundColor =
    (categoryName && CATEGORY_COLORS[categoryName]) ||
    DEFAULT_CATEGORY_TAG_COLOR;
  return {
    backgroundColor,
    color: getContrastText(backgroundColor),
  };
}
