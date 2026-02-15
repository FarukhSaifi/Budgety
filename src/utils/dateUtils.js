/**
 * Central date utilities using dayjs for the whole app.
 * Use this instead of new Date() for parsing, formatting, and date math.
 */
import { DATE_FORMAT_STORAGE } from "@constants";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/**
 * Parse date/datetime string to dayjs. Accepts ISO (2018-04-04T16:00:00.000Z), YYYY-MM-DD, or DD-MM-YYYY.
 * @param {string} dateString
 * @returns {dayjs.Dayjs | null}
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  let d = dayjs(dateString);
  if (!d.isValid()) d = dayjs(dateString, DATE_FORMAT_STORAGE, true);
  if (!d.isValid()) d = dayjs(dateString, "DD-MM-YYYY", true);
  return d.isValid() ? d : null;
}

/**
 * Today's date in storage format (YYYY-MM-DD).
 */
export function todayStorage() {
  return dayjs().format(DATE_FORMAT_STORAGE);
}

/**
 * Current time as full ISO string (e.g. 2018-04-04T16:00:00.000Z). Use for createdAt, paidDate, etc.
 */
export function nowISO() {
  return dayjs().toISOString();
}

/**
 * Given date string (ISO, YYYY-MM-DD, or DD-MM-YYYY), return full ISO string.
 * For date-only input, uses midnight UTC. Use for storage when ISO is required everywhere.
 */
export function toISOString(dateString) {
  const d = dateString ? parseDate(dateString) : dayjs();
  return d ? d.toISOString() : "";
}

/**
 * Get { month: 1-12, year } from a date string.
 * @param {string} dateString
 * @returns {{ month: number, year: number } | null}
 */
export function getMonthYear(dateString) {
  const d = parseDate(dateString);
  if (!d) return null;
  return { month: d.month() + 1, year: d.year() };
}

/**
 * Current month (1-12) and year.
 */
export function getCurrentMonthYear() {
  const d = dayjs();
  return { month: d.month() + 1, year: d.year() };
}

/**
 * Build a dayjs from year, month (1-12), and optional day.
 */
export function dateFromMonthYear(year, month, day = 1) {
  return dayjs()
    .year(year)
    .month(month - 1)
    .date(day);
}

/**
 * Days in month for given year and month (1-12).
 */
export function daysInMonth(year, month) {
  return dayjs()
    .year(year)
    .month(month - 1)
    .daysInMonth();
}

/**
 * Compare two date strings for sorting (returns -1, 0, 1).
 */
export function compareDates(a, b) {
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
export function compareDatesOrTimestamps(aDate, aCreatedAt, bDate, bCreatedAt) {
  const cmp = compareDates(aDate, bDate);
  if (cmp !== 0) return cmp;
  const tA = dayjs(aCreatedAt || aDate).valueOf();
  const tB = dayjs(bCreatedAt || bDate).valueOf();
  return tA - tB;
}

/**
 * Is same calendar day?
 */
export function isSameDay(dateStrA, dateStrB) {
  const dA = parseDate(dateStrA);
  const dB = parseDate(dateStrB);
  if (!dA || !dB) return false;
  return dA.isSame(dB, "day");
}

/**
 * Is date in given month/year? (month 1-12)
 */
export function isInMonthYear(dateString, month, year) {
  const d = parseDate(dateString);
  if (!d) return false;
  return d.month() + 1 === month && d.year() === year;
}

/**
 * Day of month (1-31) from date string.
 */
export function dayOfMonth(dateString) {
  const d = parseDate(dateString);
  return d ? d.date() : 0;
}

/**
 * Day of week (0-6, Sunday=0) for the first day of given month/year.
 */
export function startOfMonthDayOfWeek(year, month) {
  return dayjs()
    .year(year)
    .month(month - 1)
    .date(1)
    .day();
}

/**
 * Sort comparator for transactions by date then createdAt (ascending). Negate for descending.
 */
export function compareByDateThenCreatedAt(a, b) {
  const cmp = compareDates(a.date || a.createdAt, b.date || b.createdAt);
  if (cmp !== 0) return cmp;
  return (
    dayjs(a.createdAt || a.date).valueOf() -
    dayjs(b.createdAt || b.date).valueOf()
  );
}
