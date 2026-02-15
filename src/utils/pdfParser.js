import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as pdfjsLib from "pdfjs-dist";

// Extend dayjs with custom parse format plugin
dayjs.extend(customParseFormat);

// Set worker source for pdfjs (jsDelivr serves npm package; cdnjs path differs)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
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
    throw new Error(`Failed to extract text from PDF: ${error.message}`, {
      cause: error,
    });
  }
};

/**
 * Parse PDF text and extract transaction data
 * This function handles ICICI bank statement format where transactions
 * span multiple lines
 */
export const parsePDFText = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());
  const transactions = [];

  // ICICI bank statement pattern: S No. followed by date and transaction details
  // Transaction can span multiple lines
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for line starting with serial number and date pattern
    // Format: "1 08.02.2026 ..." or "1 08.02.2026"
    const serialDateMatch = line.match(/^(\d+)\s+(\d{2}\.\d{2}\.\d{4})\s*(.*)/);

    if (serialDateMatch) {
      const dateStr = serialDateMatch[2]; // e.g., "08.02.2026"
      const description = serialDateMatch[3] || ""; // Rest of the line

      let nextLineIndex = i + 1;
      let fullText = description;
      let withdrawAmount = "";
      let depositAmount = "";
      let balance = "";

      // Keep reading lines until we find the amounts (last line of transaction)
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();

        // Check if next line starts with a new serial number (new transaction)
        if (/^\d+\s+\d{2}\.\d{2}\.\d{4}/.test(nextLine)) {
          break;
        }

        // Check if this line contains amounts (numbers with decimals at the end)
        // Format: "... 100.00 3634.62" or "... 50000.00 53634.62"
        const amountMatch = nextLine.match(
          /([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/,
        );
        if (amountMatch) {
          // This is the last line with amounts
          const beforeAmounts = nextLine.substring(
            0,
            nextLine.lastIndexOf(amountMatch[0]),
          );
          fullText += " " + beforeAmounts;

          // Determine which is withdrawal and which is deposit based on context
          // In ICICI format: first amount is transaction, second is balance
          const amount1 = amountMatch[1].replace(/,/g, "");
          const amount2 = amountMatch[2].replace(/,/g, "");

          // Check the description for keywords to determine transaction type
          const descLower = fullText.toLowerCase();

          if (descLower.includes("payment fr")) {
            // Incoming payment (deposit) - "Payment fr" indicates money received
            depositAmount = amount1;
          } else if (
            descLower.includes("paid via") ||
            descLower.includes("payment on")
          ) {
            // Outgoing payment (withdrawal) - "Paid via" or "payment on" indicates money sent
            withdrawAmount = amount1;
          } else if (fullText.includes("BIL/INFT")) {
            // Internal fund transfer - usually deposit
            depositAmount = amount1;
          } else {
            // Default: assume withdrawal for UPI/NEFT/IMPS transactions
            withdrawAmount = amount1;
          }

          balance = amount2;

          nextLineIndex++;
          break;
        }

        // Not amounts yet, add to description
        fullText += " " + nextLine;
        nextLineIndex++;

        // Safety: don't read more than 10 lines for a single transaction
        if (nextLineIndex - i > 10) {
          break;
        }
      }

      // Create transaction object if we have valid data
      if (fullText.trim() && (withdrawAmount || depositAmount)) {
        const transaction = {
          date: dateStr,
          description: fullText.trim(),
          amount: withdrawAmount || depositAmount || "",
          type: withdrawAmount ? "debit" : "credit",
          mode: "",
          balance,
          raw: [dateStr, fullText.trim(), withdrawAmount, depositAmount],
        };

        transactions.push(transaction);
      }

      // Move to the next transaction
      i = nextLineIndex;
    } else {
      i++;
    }
  }

  return transactions;
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
    throw new Error(`Failed to parse PDF: ${error.message}`, { cause: error });
  }
};
