/**
 * Utility functions for exporting data
 */
import { ERROR_MESSAGES, UI_TEXT } from "@constants";
import { formatForDisplay } from "@hooks/useDateFormatter";
import type { Transaction } from "@types";
import { todayStorage } from "@utils/dateUtils";
import { showError, showSuccess } from "@utils/toast";

type CsvRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: CsvRow[],
  filename = "export.csv",
  headers: string[] | null = null,
): void => {
  if (!data || data.length === 0) {
    showError(ERROR_MESSAGES.NO_DATA_TO_EXPORT);
    return;
  }

  const csvHeaders = headers || Object.keys(data[0]);

  const csvContent = [
    csvHeaders.join(","),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showSuccess(UI_TEXT.SUCCESS_EXPORT.replace("{filename}", filename));
};

/**
 * Export chart data to CSV
 */
export const exportChartData = (
  chartData: CsvRow[],
  chartName = "chart",
): void => {
  if (!chartData || chartData.length === 0) {
    showError(ERROR_MESSAGES.NO_DATA_TO_EXPORT);
    return;
  }

  const timestamp = todayStorage();
  const filename = `${chartName}_${timestamp}.csv`;
  exportToCSV(chartData, filename);
};

/**
 * Export transactions to CSV
 */
export const exportTransactions = (transactions: Transaction[]): void => {
  if (!transactions || transactions.length === 0) {
    showError(ERROR_MESSAGES.NO_TRANSACTIONS_TO_EXPORT);
    return;
  }

  const data = transactions.map((t) => ({
    Date: formatForDisplay(t.date, "short"),
    Type: t.type,
    Description: t.description ?? t.title,
    Category: t.category,
    Mode: t.mode ?? t.paymentMode,
    Amount: t.amount,
  }));

  const timestamp = todayStorage();
  exportToCSV(data, `transactions_${timestamp}.csv`);
};
