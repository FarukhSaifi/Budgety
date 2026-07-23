import { useMemo } from "react";

import {
  DATE_FORMAT,
  DATE_FORMAT_LONG,
  DATE_FORMAT_MONTH_DAY,
} from "@constants";

import { parseDate, toStorageDate as toStorageDateUtil } from "@utils/dateUtils";

export type DateFormatType =
  | "short"
  | "long"
  | "numeric"
  | "monthYear"
  | "monthDay";

/**
 * Format a date string for display. Accepts ISO, YYYY-MM-DD, or DD-MM-YYYY.
 */
export function formatForDisplay(
  dateString: string | null | undefined,
  formatType: DateFormatType = "short",
): string {
  const d = parseDate(dateString);
  if (!d) return "";
  if (formatType === "long") return d.format(DATE_FORMAT_LONG);
  if (formatType === "numeric") return d.format("DD/MM/YYYY");
  if (formatType === "monthYear") return d.format("MMMM YYYY");
  if (formatType === "monthDay") return d.format(DATE_FORMAT_MONTH_DAY);
  return d.format(DATE_FORMAT);
}

/** Normalize any date input to YYYY-MM-DD for storage. */
export function toStorageDate(dateString: string | null | undefined): string {
  return toStorageDateUtil(dateString);
}

export interface DateFormatter {
  formatDate: (dateString: string | null | undefined, format?: DateFormatType) => string;
  formatDateRange: (startDate?: string | null, endDate?: string | null) => string;
  toStorageDate: (dateString: string | null | undefined) => string;
}

export const useDateFormatter = (): DateFormatter => {
  const formatDate = useMemo(
    () =>
      (dateString: string | null | undefined, format: DateFormatType = "short") =>
        formatForDisplay(dateString, format),
    [],
  );

  const formatDateRange = useMemo(
    () =>
      (startDate?: string | null, endDate?: string | null): string => {
        if (!startDate || !endDate) return "";
        return `${formatForDisplay(startDate)} - ${formatForDisplay(endDate)}`;
      },
    [],
  );

  const toStorageDateSafe = useMemo(() => toStorageDate, []);

  return { formatDate, formatDateRange, toStorageDate: toStorageDateSafe };
};
