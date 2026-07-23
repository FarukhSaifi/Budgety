import { CATEGORY_COLORS, DEFAULT_CATEGORY_TAG_COLOR, STITCH_CHART_COLORS } from "@constants";

const CATEGORY_COLOR_LOOKUP = (() => {
  const map = new Map<string, string>();
  for (const [name, hex] of Object.entries(CATEGORY_COLORS as Record<string, string>)) {
    map.set(name.toLowerCase(), hex);
  }
  return map;
})();

function hashCategoryName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function parseHex(hex: string | null | undefined): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== "string") return null;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Soft translucent fill from a solid category hex (chips / icon tiles). */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Returns "white" or dark gray for text on a given hex background (WCAG contrast).
 */
export function getContrastText(hex: string | null | undefined): string {
  const rgb = parseHex(hex);
  if (!rgb) return "#1f2937";
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? "#1f2937" : "#ffffff";
}

function lookupKnownCategoryColor(categoryName: string | null | undefined): string | null {
  if (!categoryName) return null;
  const known = CATEGORY_COLOR_LOOKUP.get(String(categoryName).trim().toLowerCase());
  if (!known || known.toLowerCase() === DEFAULT_CATEGORY_TAG_COLOR.toLowerCase()) {
    return null;
  }
  return known;
}

/**
 * Multi-color chart / progress fill for a category (bars, donuts, chips).
 * Prefers CATEGORY_COLORS (case-insensitive). Unknown names use a stable hash into
 * STITCH_CHART_COLORS so the same category always matches across bar + list.
 */
export function getCategoryChartColor(categoryName: string | null | undefined, index = 0): string {
  const known = lookupKnownCategoryColor(categoryName);
  if (known) return known;
  const slot = categoryName ? hashCategoryName(String(categoryName).trim().toLowerCase()) : Math.abs(index);
  return STITCH_CHART_COLORS[slot % STITCH_CHART_COLORS.length];
}

export interface CategoryTagStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Style for a category tag (solid background + contrasting text).
 */
export function getCategoryTagStyle(categoryName: string | null | undefined, index = 0): CategoryTagStyle {
  const backgroundColor = getCategoryChartColor(categoryName, index);
  return {
    backgroundColor,
    color: getContrastText(backgroundColor),
  };
}

/**
 * Soft chip / icon-tile style using the same hex as spend bars for that category.
 */
export function getCategorySoftStyle(categoryName: string | null | undefined, index = 0): CategoryTagStyle {
  const hex = getCategoryChartColor(categoryName, index);
  return {
    backgroundColor: hexToRgba(hex, 0.16),
    color: hex,
  };
}
