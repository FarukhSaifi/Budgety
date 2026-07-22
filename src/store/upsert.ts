/**
 * Idempotent upsert by `id` — replaces an existing record or prepends a new one.
 * Keeps optimistic thunk results and real-time onSnapshot payloads from
 * producing duplicate entries in list slices.
 */
export function upsertById<T extends { id: string }>(items: T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) return [next, ...items];
  const copy = items.slice();
  copy[index] = next;
  return copy;
}
