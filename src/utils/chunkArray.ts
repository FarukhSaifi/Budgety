/**
 * Split an array into contiguous chunks of at most `size` items.
 * Empty input → []; invalid size → single chunk of all items (when non-empty).
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  if (size <= 0) return [items];

  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
