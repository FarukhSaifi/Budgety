/**
 * Tiny classnames joiner — filters falsy values and joins with a space.
 * Keeps component markup readable without pulling in an extra dependency.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
