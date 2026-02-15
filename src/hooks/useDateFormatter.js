import { DATE_FORMAT, DATE_FORMAT_LONG, DATE_FORMAT_STORAGE } from "@constants";
import { parseDate } from "@utils/dateUtils";
import { useMemo } from "react";

/**
 * Format date for display. Accepts ISO string (2018-04-04T16:00:00.000Z), YYYY-MM-DD, or DD-MM-YYYY.
 * - short: DD-MM-YYYY
 * - long: DD-MMM-YYYY HH:MM AM/PM
 */
function formatForDisplay(dateString, formatType = "short") {
  const d = parseDate(dateString);
  if (!d) return "";

  if (formatType === "short" || !formatType) return d.format(DATE_FORMAT);
  if (formatType === "long") return d.format(DATE_FORMAT_LONG);
  if (formatType === "numeric") return d.format("DD/MM/YYYY");
  if (formatType === "monthYear") return d.format("MMMM YYYY");
  return d.format(DATE_FORMAT);
}

/**
 * Normalize any date input to YYYY-MM-DD for API/DB storage.
 * Accepts YYYY-MM-DD, DD-MM-YYYY, or parseable date string.
 */
function toStorageDate(dateString) {
  const d = parseDate(dateString);
  return d ? d.format(DATE_FORMAT_STORAGE) : "";
}

export const useDateFormatter = () => {
  const formatDate = useMemo(
    () =>
      (dateString, format = "short") =>
        formatForDisplay(dateString, format),
    [],
  );

  const formatDateRange = useMemo(
    () => (startDate, endDate) => {
      if (!startDate || !endDate) return "";
      return `${formatForDisplay(startDate, "short")} - ${formatForDisplay(endDate, "short")}`;
    },
    [],
  );

  const toStorageDateSafe = useMemo(() => toStorageDate, []);

  return { formatDate, formatDateRange, toStorageDate: toStorageDateSafe };
};

export { formatForDisplay, toStorageDate };
