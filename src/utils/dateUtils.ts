/**
 * Central date utilities using dayjs for the whole app.
 * Use this instead of new Date() for parsing, formatting, and date math.
 */
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { DATE_FORMAT, DATE_FORMAT_STORAGE, UI_TEXT } from "@constants";

dayjs.extend(customParseFormat);

export interface MonthYear {
  month: number;
  year: number;
}

export interface DateSortable {
  date?: string | null;
  createdAt?: string | null;
}

/**
 * Parse date/datetime string to dayjs. Accepts ISO (2018-04-04T16:00:00.000Z), YYYY-MM-DD, or DD-MM-YYYY.
 */
export function parseDate(dateString: string | null | undefined): Dayjs | null {
  if (!dateString) return null;
  let d = dayjs(dateString);
  if (!d.isValid()) d = dayjs(dateString, DATE_FORMAT_STORAGE, true);
  if (!d.isValid()) d = dayjs(dateString, "DD-MM-YYYY", true);
  return d.isValid() ? d : null;
}

/**
 * Normalize any date input to storage format (YYYY-MM-DD).
 * Returns empty string when the value cannot be parsed.
 */
export function toStorageDate(dateString: string | null | undefined): string {
  const d = parseDate(dateString);
  return d ? d.format(DATE_FORMAT_STORAGE) : "";
}

/**
 * Today's date in storage format (YYYY-MM-DD).
 */
export function todayStorage(): string {
  return dayjs().format(DATE_FORMAT_STORAGE);
}

/**
 * Current time as full ISO string (e.g. 2018-04-04T16:00:00.000Z). Use for createdAt, paidDate, etc.
 */
export function nowISO(): string {
  return dayjs().toISOString();
}

/**
 * Given date string (ISO, YYYY-MM-DD, or DD-MM-YYYY), return full ISO string.
 * For date-only input, uses midnight UTC. Use for storage when ISO is required everywhere.
 */
export function toISOString(dateString?: string | null): string {
  const d = dateString ? parseDate(dateString) : dayjs();
  return d ? d.toISOString() : "";
}

/**
 * Get { month: 1-12, year } from a date string.
 * Fast-path for ISO / storage dates (`YYYY-MM-DD…`) avoids dayjs parse.
 */
export function getMonthYear(dateString: string | null | undefined): MonthYear | null {
  if (!dateString) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) return { month, year };
  }
  const d = parseDate(dateString);
  if (!d) return null;
  return { month: d.month() + 1, year: d.year() };
}

/**
 * Current month (1-12) and year.
 */
export function getCurrentMonthYear(): MonthYear {
  const d = dayjs();
  return { month: d.month() + 1, year: d.year() };
}

/**
 * Build a dayjs from year, month (1-12), and optional day.
 */
export function dateFromMonthYear(year: number, month: number, day = 1): Dayjs {
  return dayjs()
    .year(year)
    .month(month - 1)
    .date(day);
}

/**
 * Days in month for given year and month (1-12).
 */
export function daysInMonth(year: number, month: number): number {
  return dayjs()
    .year(year)
    .month(month - 1)
    .daysInMonth();
}

/**
 * Compare two date strings for sorting (returns -1, 0, 1).
 */
export function compareDates(a: string | null | undefined, b: string | null | undefined): number {
  const dA = parseDate(a);
  const dB = parseDate(b);
  if (!dA || !dB) return 0;
  if (dA.isBefore(dB)) return -1;
  if (dA.isAfter(dB)) return 1;
  return 0;
}

/**
 * Compare two date strings or timestamps (for createdAt fallback). Returns number for sort.
 */
export function compareDatesOrTimestamps(
  aDate: string | null | undefined,
  aCreatedAt: string | null | undefined,
  bDate: string | null | undefined,
  bCreatedAt: string | null | undefined,
): number {
  const cmp = compareDates(aDate, bDate);
  if (cmp !== 0) return cmp;
  const tA = dayjs(aCreatedAt || aDate).valueOf();
  const tB = dayjs(bCreatedAt || bDate).valueOf();
  return tA - tB;
}

/**
 * Is same calendar day?
 */
export function isSameDay(dateStrA: string | null | undefined, dateStrB: string | null | undefined): boolean {
  const dA = parseDate(dateStrA);
  const dB = parseDate(dateStrB);
  if (!dA || !dB) return false;
  return dA.isSame(dB, "day");
}

/**
 * Is date in given month/year? (month 1-12)
 */
export function isInMonthYear(dateString: string | null | undefined, month: number, year: number): boolean {
  const d = parseDate(dateString);
  if (!d) return false;
  return d.month() + 1 === month && d.year() === year;
}

/**
 * Day of month (1-31) from date string.
 */
export function dayOfMonth(dateString: string | null | undefined): number {
  const d = parseDate(dateString);
  return d ? d.date() : 0;
}

/**
 * Day of week (0-6, Sunday=0) for the first day of given month/year.
 */
export function startOfMonthDayOfWeek(year: number, month: number): number {
  return dayjs()
    .year(year)
    .month(month - 1)
    .date(1)
    .day();
}

/**
 * Sort comparator for transactions by date then createdAt (ascending). Negate for descending.
 */
export function compareByDateThenCreatedAt(a: DateSortable, b: DateSortable): number {
  const cmp = compareDates(a.date || a.createdAt, b.date || b.createdAt);
  if (cmp !== 0) return cmp;
  return dayjs(a.createdAt || a.date).valueOf() - dayjs(b.createdAt || b.date).valueOf();
}

/**
 * Human-readable relative time (e.g. "2 hours ago") for transaction timestamps.
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  const d = parseDate(dateString);
  if (!d) return "";

  const now = dayjs();
  const diffMins = now.diff(d, "minute");
  if (diffMins < 1) return UI_TEXT.JUST_NOW;
  if (diffMins === 1) return `1 ${UI_TEXT.MINUTE_AGO}`;
  if (diffMins < 60) return `${diffMins} ${UI_TEXT.MINUTES_AGO}`;

  const diffHours = now.diff(d, "hour");
  if (diffHours === 1) return `1 ${UI_TEXT.HOUR_AGO}`;
  if (diffHours < 24) return `${diffHours} ${UI_TEXT.HOURS_AGO}`;

  const diffDays = now.diff(d, "day");
  if (diffDays === 1) return `1 ${UI_TEXT.DAY_AGO}`;
  if (diffDays < 7) return `${diffDays} ${UI_TEXT.DAYS_AGO}`;

  return d.format(DATE_FORMAT);
}
