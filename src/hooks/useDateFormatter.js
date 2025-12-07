import { useMemo } from "react";

export const useDateFormatter = () => {
  const formatDate = useMemo(
    () =>
      (dateString, format = "short") => {
        if (!dateString) return "";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";

        // Default format: DD-MM-YYYY (e.g., 15-01-2025)
        if (format === "short" || !format) {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }

        // Other format options
        const formats = {
          long: {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
          numeric: {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          },
          monthYear: {
            year: "numeric",
            month: "long",
          },
        };

        if (formats[format]) {
          return date.toLocaleDateString("en-IN", formats[format]);
        }

        // Fallback to default DD-MM-YYYY
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
    []
  );

  const formatDateRange = useMemo(
    () => (startDate, endDate) => {
      if (!startDate || !endDate) return "";
      const start = formatDate(startDate, "short");
      const end = formatDate(endDate, "short");
      return `${start} - ${end}`;
    },
    [formatDate]
  );

  return { formatDate, formatDateRange };
};
