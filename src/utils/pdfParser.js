import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as pdfjsLib from "pdfjs-dist";

// Extend dayjs with custom parse format plugin
dayjs.extend(customParseFormat);

// Set worker source for pdfjs
// Use a CDN that supports CORS, or use the local worker file
if (typeof window !== "undefined") {
  // Try to use the worker from node_modules, fallback to CDN
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.js",
      import.meta.url
    ).toString();
  } catch {
    // Fallback to CDN if local worker not available
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
}

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Parse PDF text and extract transaction data
 * This function attempts to identify table-like structures in the PDF text
 * and extract transaction information
 */
export const parsePDFText = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());
  const transactions = [];
  let headers = null;
  let headerLineIndex = -1;

  // Try to find header row (common patterns in bank statements)
  const headerPatterns = [
    /date|transaction.*date|value.*date/i,
    /description|narration|particulars|details/i,
    /amount|debit|credit|deposit|withdrawal/i,
    /balance|closing.*balance/i,
  ];

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].toLowerCase();
    const matches = headerPatterns.filter((pattern) => pattern.test(line));
    if (matches.length >= 2) {
      headers = lines[i].split(/\s{2,}|\t/).map((h) => h.trim());
      headerLineIndex = i;
      break;
    }
  }

  // If no headers found, try to detect column structure from first few data rows
  if (!headers) {
    // Look for lines with date-like patterns and amounts
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const line = lines[i];
      // Check if line contains date pattern and amount pattern
      const datePattern =
        /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s+\w{3}\s+\d{2,4}/;
      const hasDate = datePattern.test(line);
      const hasAmount = /[\d,]+\.?\d{0,2}/.test(line);
      if (hasDate && hasAmount) {
        // Try to split by multiple spaces or tabs
        const parts = line.split(/\s{2,}|\t/).filter((p) => p.trim());
        if (parts.length >= 3) {
          headerLineIndex = i - 1;
          break;
        }
      }
    }
  }

  // Extract transactions from data rows
  const startIndex = headerLineIndex >= 0 ? headerLineIndex + 1 : 0;
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip lines that look like headers or footers
    if (/total|balance|opening|closing|page|\d+\s*of\s*\d+/i.test(line)) {
      continue;
    }

    // Try to extract transaction data
    const transaction = extractTransactionFromLine(line);
    if (transaction && transaction.date && transaction.amount) {
      transactions.push(transaction);
    }
  }

  return transactions;
};

/**
 * Parse date string using dayjs (same as bankStatementParser)
 */
const parseDateFromText = (dateStr) => {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  const cleanDateStr = dateStr.trim();

  // Common date formats in bank statements (same as bankStatementParser)
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
      return parsed.format("YYYY-MM-DD");
    }
  }

  // Try parsing as-is (dayjs can handle many formats automatically)
  const autoParsed = dayjs(cleanDateStr);
  if (autoParsed.isValid()) {
    return autoParsed.format("YYYY-MM-DD");
  }

  return null;
};

/**
 * Extract transaction data from a single line of text
 */
const extractTransactionFromLine = (line) => {
  // Common date patterns for matching in text
  const datePatterns = [
    /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/, // DD-MM-YYYY or DD/MM/YYYY
    /\d{4}[-/]\d{1,2}[-/]\d{1,2}/, // YYYY-MM-DD
    /\d{1,2}\s+\w{3}\s+\d{2,4}/, // DD MMM YYYY
  ];

  // Amount patterns (with currency symbols and commas)
  const amountPattern = /[\d,]+\.?\d{0,2}/g;

  // Find date string in line
  let dateStr = null;
  for (const pattern of datePatterns) {
    const match = line.match(pattern);
    if (match) {
      dateStr = match[0];
      break;
    }
  }

  // Parse date using dayjs
  const date = dateStr ? parseDateFromText(dateStr) : null;

  // Find amounts
  const amounts = line.match(amountPattern);
  if (!amounts || amounts.length === 0) {
    return null;
  }

  // Extract description (text between date and first amount)
  let description = "";
  if (date) {
    const dateIndex = line.indexOf(date);
    const firstAmountIndex = line.indexOf(amounts[0]);
    if (firstAmountIndex > dateIndex) {
      description = line
        .substring(dateIndex + date.length, firstAmountIndex)
        .trim();
    } else {
      description = line.substring(0, firstAmountIndex).trim();
    }
  } else {
    const firstAmountIndex = line.indexOf(amounts[0]);
    description = line.substring(0, firstAmountIndex).trim();
  }

  // Clean up description
  description = description
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim();

  // Determine amount and type
  // Usually the last amount is the balance, second last might be transaction amount
  let amount = "";
  let type = "";

  if (amounts.length >= 2) {
    // Assume second last is transaction amount, last is balance
    amount = amounts[amounts.length - 2];
    // Try to determine type from context
    const lineLower = line.toLowerCase();
    if (
      lineLower.includes("credit") ||
      lineLower.includes("cr") ||
      lineLower.includes("deposit")
    ) {
      type = "credit";
    } else if (
      lineLower.includes("debit") ||
      lineLower.includes("dr") ||
      lineLower.includes("withdraw")
    ) {
      type = "debit";
    }
  } else if (amounts.length === 1) {
    amount = amounts[0];
  }

  if (!date || !amount) {
    return null;
  }

  return {
    date,
    description: description || "Transaction",
    amount,
    type: type || "",
    mode: "",
    balance: amounts[amounts.length - 1] || "",
    raw: [dateStr || date, description, amount, type],
  };
};

/**
 * Parse PDF file and extract transaction data
 * @param {File} file - PDF file
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const parsePDF = async (file) => {
  try {
    const text = await extractTextFromPDF(file);
    const transactions = parsePDFText(text);
    return transactions;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};
