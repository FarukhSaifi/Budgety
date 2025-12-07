import {
  COLUMN_MAPPING_PATTERNS,
  TRANSACTION_CODE_PATTERNS,
  TRANSACTION_MODES,
  TRANSACTION_TYPES,
} from "@constants";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Extend dayjs with custom parse format plugin
dayjs.extend(customParseFormat);

/**
 * Parse CSV line with proper handling of quoted fields
 * Handles various CSV formats including quoted fields, escaped quotes, and different delimiters
 */
export const parseCSVLine = (line) => {
  if (!line || typeof line !== "string") {
    return [];
  }

  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++; // Skip next quote
      } else if (inQuotes && nextChar === ",") {
        // End of quoted field
        inQuotes = false;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push the last field
  result.push(current.trim());

  // Remove quotes from field values if they exist
  return result.map((field) => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"');
    }
    return field;
  });
};

/**
 * Auto-detect column mapping from headers
 */
export const detectColumnMapping = (headers) => {
  const normalizedHeaders = headers.map((h) =>
    String(h || "")
      .trim()
      .toLowerCase()
  );

  const findColumnIndex = (patterns) => {
    return normalizedHeaders.findIndex((header) => {
      // Check for exact match first (case-insensitive)
      const exactMatch = patterns.some(
        (pattern) => header === pattern.toLowerCase()
      );
      if (exactMatch) return true;

      // Then check for partial match
      return patterns.some((pattern) => header.includes(pattern.toLowerCase()));
    });
  };

  return {
    serial: findColumnIndex(COLUMN_MAPPING_PATTERNS.SERIAL),
    date: findColumnIndex(COLUMN_MAPPING_PATTERNS.DATE),
    mode: findColumnIndex(COLUMN_MAPPING_PATTERNS.MODE),
    description: findColumnIndex(COLUMN_MAPPING_PATTERNS.DESCRIPTION),
    deposits: findColumnIndex(COLUMN_MAPPING_PATTERNS.DEPOSITS),
    withdraw: findColumnIndex(COLUMN_MAPPING_PATTERNS.WITHDRAW),
    amount: findColumnIndex(COLUMN_MAPPING_PATTERNS.AMOUNT),
    balance: findColumnIndex(COLUMN_MAPPING_PATTERNS.BALANCE),
    type: findColumnIndex(COLUMN_MAPPING_PATTERNS.TYPE),
  };
};

/**
 * Parse date string in various formats using dayjs
 * Supports multiple date formats commonly used in bank statements
 */
export const parseDate = (dateStr) => {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  const cleanDateStr = dateStr.trim();

  // Common date formats in bank statements
  // Prioritize DD-MM-YYYY format as it's the app's default format
  const dateFormats = [
    "DD-MM-YYYY", // App default format - prioritize this
    "DD/MM/YYYY", // Alternative format
    "DD.MM.YYYY",
    "YYYY-MM-DD", // ISO format
    "MM-DD-YYYY", // US format
    "MM/DD/YYYY",
    "MM.DD.YYYY",
    "DD-MMM-YYYY", // e.g., 01-Jan-2024
    "DD MMM YYYY", // e.g., 01 Jan 2024
    "DD-MMM-YY", // e.g., 01-Jan-24
    "DD/MMM/YYYY",
    "YYYY/MM/DD",
    "YYYY-MM-DD HH:mm:ss", // With time
    "DD-MM-YYYY HH:mm:ss",
    "DD/MM/YYYY HH:mm:ss",
  ];

  // Try parsing with each format
  for (const format of dateFormats) {
    const parsed = dayjs(cleanDateStr, format, true); // strict parsing
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }

  // Try parsing as-is (dayjs can handle many formats automatically)
  const autoParsed = dayjs(cleanDateStr);
  if (autoParsed.isValid()) {
    return autoParsed.toDate();
  }

  return null;
};

/**
 * Parse amount string and extract numeric value
 */
export const parseAmount = (amountStr) => {
  if (!amountStr) return 0;

  const cleanAmountStr = String(amountStr).trim();
  const numericAmount = parseFloat(
    cleanAmountStr.replace(/[^0-9.-]/g, "") || "0"
  );

  return isNaN(numericAmount) ? 0 : Math.abs(numericAmount);
};

/**
 * Detect transaction type from amount and type field
 */
export const detectTransactionType = (amountStr, typeField) => {
  if (typeField) {
    const lowerType = typeField.toLowerCase().trim();
    if (
      lowerType.includes("credit") ||
      lowerType === "cr" ||
      lowerType.includes("income")
    ) {
      return TRANSACTION_TYPES.INCOME;
    }
    if (
      lowerType.includes("debit") ||
      lowerType === "dr" ||
      lowerType.includes("expense")
    ) {
      return TRANSACTION_TYPES.EXPENSE;
    }
  }

  // If amount is negative, it's likely an expense
  const originalAmount = parseFloat(
    String(amountStr || "").replace(/[^0-9.-]/g, "") || "0"
  );
  return originalAmount < 0
    ? TRANSACTION_TYPES.EXPENSE
    : TRANSACTION_TYPES.INCOME;
};

/**
 * Detect transaction mode from description
 */
export const detectTransactionMode = (description) => {
  if (!description) return TRANSACTION_MODES.OTHER;

  const desc = description.toUpperCase();

  // Check for UPI
  if (TRANSACTION_CODE_PATTERNS.UPI.test(desc)) {
    return TRANSACTION_MODES.UPI;
  }
  // Check for NEFT
  if (TRANSACTION_CODE_PATTERNS.NEFT.test(desc)) {
    return TRANSACTION_MODES.NEFT;
  }
  // Check for IMPS
  if (TRANSACTION_CODE_PATTERNS.IMPS.test(desc)) {
    return TRANSACTION_MODES.IMPS;
  }
  // Check for RTGS
  if (TRANSACTION_CODE_PATTERNS.RTGS.test(desc)) {
    return TRANSACTION_MODES.RTGS;
  }
  // Check for Card transactions
  if (TRANSACTION_CODE_PATTERNS.VPS.test(desc) || desc.includes("CARD")) {
    return TRANSACTION_MODES.CARD;
  }
  // Check for Net Banking
  if (
    TRANSACTION_CODE_PATTERNS.INF.test(desc) ||
    desc.includes("NET BANKING")
  ) {
    return TRANSACTION_MODES.NET_BANKING;
  }
  // Check for Cheque
  if (
    TRANSACTION_CODE_PATTERNS.UCCBRN.test(desc) ||
    TRANSACTION_CODE_PATTERNS.LCCBRN.test(desc) ||
    desc.includes("CHEQUE")
  ) {
    return TRANSACTION_MODES.CHEQUE;
  }
  // Check for Cash
  if (TRANSACTION_CODE_PATTERNS.VAT.test(desc) || desc.includes("CASH")) {
    return TRANSACTION_MODES.CASH;
  }

  return TRANSACTION_MODES.OTHER;
};

/**
 * Normalize mode value from column
 */
export const normalizeMode = (modeValue) => {
  if (!modeValue || !modeValue.trim()) {
    return null;
  }

  const modeUpper = modeValue.trim().toUpperCase();

  if (modeUpper.includes("UPI")) return TRANSACTION_MODES.UPI;
  if (modeUpper.includes("NEFT")) return TRANSACTION_MODES.NEFT;
  if (modeUpper.includes("IMPS")) return TRANSACTION_MODES.IMPS;
  if (modeUpper.includes("RTGS")) return TRANSACTION_MODES.RTGS;
  if (modeUpper.includes("CARD") || modeUpper.includes("VPS"))
    return TRANSACTION_MODES.CARD;
  if (modeUpper.includes("NET") || modeUpper.includes("BANKING"))
    return TRANSACTION_MODES.NET_BANKING;
  if (modeUpper.includes("CHEQUE") || modeUpper.includes("CHQ"))
    return TRANSACTION_MODES.CHEQUE;
  if (modeUpper.includes("CASH")) return TRANSACTION_MODES.CASH;

  return null;
};

/**
 * Extract transaction data from row values using column mapping
 */
export const extractTransactionData = (values, mapping) => {
  const getValue = (index) => {
    if (index >= 0 && index < values.length) {
      return String(values[index] || "").trim();
    }
    return "";
  };

  const date = getValue(mapping.date);
  const description = getValue(mapping.description);
  const modeValue = getValue(mapping.mode);
  const depositValue = getValue(mapping.deposits);
  const withdrawValue = getValue(mapping.withdraw);
  const amountValue = getValue(mapping.amount);
  const typeValue = getValue(mapping.type);
  const balance = getValue(mapping.balance);

  // Determine amount and type from deposits/withdraw columns
  let amount = "";
  let type = "";

  const depositAmount = parseAmount(depositValue);
  const withdrawAmount = parseAmount(withdrawValue);

  // Use the column that has a value
  // Prioritize deposits/withdrawals columns over generic amount column
  if (depositAmount > 0) {
    amount = depositValue;
    type = "credit";
  } else if (withdrawAmount > 0) {
    amount = withdrawValue;
    type = "debit";
  } else if (mapping.amount >= 0 && amountValue) {
    // Fallback to generic amount column
    const genericAmount = parseAmount(amountValue);
    if (genericAmount > 0) {
      amount = amountValue;
      if (typeValue) {
        type = typeValue.toLowerCase();
      } else {
        // Try to infer from amount sign or description
        const numericAmount = parseFloat(
          String(amountValue).replace(/[^0-9.-]/g, "") || "0"
        );
        type = numericAmount < 0 ? "debit" : "credit";
      }
    }
  }

  // Normalize mode
  const mode = normalizeMode(modeValue) || "";

  return {
    date,
    description,
    amount,
    type,
    mode,
    balance,
    raw: values,
  };
};
