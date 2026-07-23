/** Shared formatting helpers for Analytics & Reports. */

export function formatDelta(delta: number | null): string | null {
  if (delta == null) return null;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.abs(delta).toFixed(1)}%`;
}

export function isCurrentCalendarMonth(month: number, year: number): boolean {
  const now = new Date();
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

/** Days elapsed in the selected month (or full month length for past months). */
export function daysElapsedInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  if (!isCurrentCalendarMonth(month, year)) return daysInMonth;
  return Math.max(1, new Date().getDate());
}
