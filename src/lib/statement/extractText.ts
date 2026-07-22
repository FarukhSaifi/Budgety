import { STATEMENT_IMPORT } from "@constants";

/**
 * Extract plain text from a PDF buffer using pdfjs-dist (Node runtime, no worker).
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ");
    pages.push(line);
  }

  return pages.join("\n").trim();
}

/** Normalize line endings and trim empty lines for CSV / statement text. */
export function normalizeStatementText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

/** Truncate oversized statement text before sending to the AI model. */
export function truncateForAi(text: string): string {
  const max = STATEMENT_IMPORT.MAX_TEXT_CHARS;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Truncated: statement exceeded ${max} characters]`;
}
