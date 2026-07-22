import {
  COLUMN_MAPPING_PATTERNS,
  TRANSACTION_CODE_PATTERNS,
  TRANSACTION_MODES,
  TRANSACTION_TYPES,
} from "@constants";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface ColumnMapping {
  serial: number;
  date: number;
  mode: number;
  description: number;
  deposits: number;
  withdraw: number;
  amount: number;
  balance: number;
  type: number;
}

export interface ParsedRawRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  mode: string;
  balance: string;
  raw: string[];
}

/** Parse CSV line with quoted fields and escaped quotes. */
export function parseCSVLine(line: string): string[] {
  if (!line || typeof line !== "string") return [];

  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (inQuotes && nextChar === ",") {
        inQuotes = false;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result.map((field) => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"');
    }
    return field;
  });
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((h) =>
    String(h || "")
      .trim()
      .toLowerCase(),
  );

  const findColumnIndex = (patterns: string[]) =>
    normalizedHeaders.findIndex((header) => {
      const exactMatch = patterns.some(
        (pattern) => header === pattern.toLowerCase(),
      );
      if (exactMatch) return true;
      return patterns.some((pattern) => header.includes(pattern.toLowerCase()));
    });

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
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const cleanDateStr = dateStr.trim();

  const dateFormats = [
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "DD.MM.YYYY",
    "YYYY-MM-DD",
    "MM-DD-YYYY",
    "MM/DD/YYYY",
    "MM.DD.YYYY",
    "DD-MMM-YYYY",
    "DD MMM YYYY",
    "DD-MMM-YY",
    "DD/MMM/YYYY",
    "YYYY/MM/DD",
    "YYYY-MM-DD HH:mm:ss",
    "DD-MM-YYYY HH:mm:ss",
    "DD/MM/YYYY HH:mm:ss",
  ];

  for (const format of dateFormats) {
    const parsed = dayjs(cleanDateStr, format, true);
    if (parsed.isValid()) return parsed.toDate();
  }

  const autoParsed = dayjs(cleanDateStr);
  if (autoParsed.isValid()) return autoParsed.toDate();
  return null;
}

export function parseAmount(amountStr: string | number | null | undefined): number {
  if (amountStr == null || amountStr === "") return 0;
  const cleanAmountStr = String(amountStr).trim();
  const numericAmount = parseFloat(
    cleanAmountStr.replace(/[^0-9.-]/g, "") || "0",
  );
  return Number.isNaN(numericAmount) ? 0 : Math.abs(numericAmount);
}

export function detectTransactionType(
  amountStr: string | number,
  typeField: string,
): string {
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

  const originalAmount = parseFloat(
    String(amountStr || "").replace(/[^0-9.-]/g, "") || "0",
  );
  return originalAmount < 0
    ? TRANSACTION_TYPES.EXPENSE
    : TRANSACTION_TYPES.INCOME;
}

export function detectTransactionMode(description: string): string {
  if (!description) return TRANSACTION_MODES.OTHER;

  const desc = description.toUpperCase();

  if (TRANSACTION_CODE_PATTERNS.UPI.test(desc)) return TRANSACTION_MODES.UPI;
  if (TRANSACTION_CODE_PATTERNS.NEFT.test(desc)) return TRANSACTION_MODES.NEFT;
  if (TRANSACTION_CODE_PATTERNS.IMPS.test(desc)) return TRANSACTION_MODES.IMPS;
  if (TRANSACTION_CODE_PATTERNS.RTGS.test(desc)) return TRANSACTION_MODES.RTGS;
  if (TRANSACTION_CODE_PATTERNS.VPS.test(desc) || desc.includes("CARD")) {
    return TRANSACTION_MODES.CARD;
  }
  if (
    TRANSACTION_CODE_PATTERNS.INF.test(desc) ||
    desc.includes("NET BANKING") ||
    desc.includes("ACH/BD") ||
    (desc.includes("ACH") && desc.includes("BD")) ||
    desc.includes("TATACAPITALHOUSINGFI")
  ) {
    return TRANSACTION_MODES.NET_BANKING;
  }
  if (
    TRANSACTION_CODE_PATTERNS.UCCBRN.test(desc) ||
    TRANSACTION_CODE_PATTERNS.LCCBRN.test(desc) ||
    desc.includes("CHEQUE")
  ) {
    return TRANSACTION_MODES.CHEQUE;
  }
  if (TRANSACTION_CODE_PATTERNS.VAT.test(desc) || desc.includes("CASH")) {
    return TRANSACTION_MODES.CASH;
  }
  if (
    desc.includes("TRF FRM SB") ||
    desc.includes("TRF FROM SB") ||
    desc.includes("TRANSFER FROM SB") ||
    desc.includes("TRANSFER FROM SAVINGS")
  ) {
    return TRANSACTION_MODES.BANK_TRANSFER;
  }

  return TRANSACTION_MODES.OTHER;
}

export function normalizeMode(modeValue: string): string | null {
  if (!modeValue?.trim()) return null;

  const modeUpper = modeValue.trim().toUpperCase();

  if (modeUpper.includes("UPI")) return TRANSACTION_MODES.UPI;
  if (modeUpper.includes("NEFT")) return TRANSACTION_MODES.NEFT;
  if (modeUpper.includes("IMPS")) return TRANSACTION_MODES.IMPS;
  if (modeUpper.includes("RTGS")) return TRANSACTION_MODES.RTGS;
  if (modeUpper.includes("CARD") || modeUpper.includes("VPS")) {
    return TRANSACTION_MODES.CARD;
  }
  if (modeUpper.includes("NET") || modeUpper.includes("BANKING")) {
    return TRANSACTION_MODES.NET_BANKING;
  }
  if (modeUpper.includes("CHEQUE") || modeUpper.includes("CHQ")) {
    return TRANSACTION_MODES.CHEQUE;
  }
  if (modeUpper.includes("CASH")) return TRANSACTION_MODES.CASH;
  if (
    modeUpper.includes("BANK TRANSFER") ||
    modeUpper.includes("TRF") ||
    (modeUpper.includes("TRANSFER") && modeUpper.includes("BANK"))
  ) {
    return TRANSACTION_MODES.BANK_TRANSFER;
  }

  return null;
}

export function extractTransactionData(
  values: string[],
  mapping: ColumnMapping,
): ParsedRawRow {
  const getValue = (index: number) => {
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

  let amount = "";
  let type = "";

  const depositAmount = parseAmount(depositValue);
  const withdrawAmount = parseAmount(withdrawValue);

  if (depositAmount > 0) {
    amount = depositValue;
    type = "credit";
  } else if (withdrawAmount > 0) {
    amount = withdrawValue;
    type = "debit";
  } else if (mapping.amount >= 0 && amountValue) {
    const genericAmount = parseAmount(amountValue);
    if (genericAmount > 0) {
      amount = amountValue;
      if (typeValue) {
        type = typeValue.toLowerCase();
      } else {
        const numericAmount = parseFloat(
          String(amountValue).replace(/[^0-9.-]/g, "") || "0",
        );
        type = numericAmount < 0 ? "debit" : "credit";
      }
    }
  }

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
}
