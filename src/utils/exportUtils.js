/**
 * Utility functions for exporting data
 */
import { showError, showSuccess } from "./toast";

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file
 * @param {Array} headers - Optional custom headers
 */
export const exportToCSV = (data, filename = "export.csv", headers = null) => {
  if (!data || data.length === 0) {
    showError("No data to export");
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Headers
    csvHeaders.join(","),
    // Data rows
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showSuccess(`Data exported successfully as ${filename}`);
};

/**
 * Export chart data to CSV
 * @param {Array} chartData - Chart data array
 * @param {string} chartName - Name of the chart
 */
export const exportChartData = (chartData, chartName = "chart") => {
  if (!chartData || chartData.length === 0) {
    showError("No data to export");
    return;
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${chartName}_${timestamp}.csv`;
  exportToCSV(chartData, filename);
};

/**
 * Export transactions to CSV
 * @param {Array} transactions - Array of transactions
 */
export const exportTransactions = (transactions) => {
  if (!transactions || transactions.length === 0) {
    showError("No transactions to export");
    return;
  }

  const data = transactions.map((t) => ({
    Date: t.date,
    Type: t.type,
    Description: t.description,
    Category: t.category,
    Mode: t.mode,
    Amount: t.amount,
  }));

  const timestamp = new Date().toISOString().split("T")[0];
  exportToCSV(data, `transactions_${timestamp}.csv`);
};

