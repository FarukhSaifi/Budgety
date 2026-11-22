import { STATEMENT_IMPORT } from "@constants";

import {
  isPdfPasswordException,
  mapPdfPasswordException,
  PdfPasswordError,
} from "@/lib/statement/pdfPasswordError";
import type { ExtractedPdfPages } from "@/lib/statement/types";

export type { ExtractedPdfPages, PdfPasswordErrorCode } from "@/lib/statement/types";
export {
  isPdfPasswordError,
  mapPdfPasswordException,
  PdfPasswordError,
} from "@/lib/statement/pdfPasswordError";

async function destroyPdfResource(resource: { destroy?: () => Promise<void> | void } | null | undefined) {
  try {
    await resource?.destroy?.();
  } catch {
    // Best-effort cleanup of pdf.js WASM/font buffers.
  }
}

/**
 * Extract per-page plain text from a PDF buffer using pdfjs-dist (Node runtime, no worker).
 * Supports optional password for protected bank/credit-card statements.
 */
export async function extractPdfPages(buffer: ArrayBuffer, password?: string): Promise<ExtractedPdfPages> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // pdf.js types vary across builds; destroy() is present at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let loadingTask: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdf: any = null;

  try {
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      ...(password ? { password } : {}),
    });

    pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const line = content.items.map((item: { str?: string }) => ("str" in item ? String(item.str) : "")).join(" ");
      pages.push(line);
    }

    return { pages, pageCount: pages.length };
  } catch (err) {
    if (isPdfPasswordException(err)) {
      throw new PdfPasswordError(mapPdfPasswordException(err, password, pdfjs.PasswordResponses));
    }
    throw err;
  } finally {
    await destroyPdfResource(pdf);
    await destroyPdfResource(loadingTask);
  }
}

/**
 * Extract plain text from a PDF buffer (all pages joined).
 * Prefer {@link extractPdfPages} + chunked parsing for large statements.
 */
export async function extractPdfText(buffer: ArrayBuffer, password?: string): Promise<string> {
  const { pages } = await extractPdfPages(buffer, password);
  return pages.join("\n").trim();
}

/** Normalize line endings and trim empty lines for CSV / statement text. */
export function normalizeStatementText(raw: string): string {
  return raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

/** Truncate oversized statement text before sending to the AI model (per chunk). */
export function truncateForAi(text: string): string {
  const max = STATEMENT_IMPORT.MAX_TEXT_CHARS;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[Truncated: statement exceeded ${max} characters]`;
}
