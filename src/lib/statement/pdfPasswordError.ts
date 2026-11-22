import { ERROR_MESSAGES, GMAIL_ERROR_MESSAGES, STATEMENT_IMPORT } from "@constants";

import type { PdfPasswordErrorCode } from "@/lib/statement/types";

/** pdf.js PasswordResponses fallbacks (NEED_PASSWORD=1, INCORRECT_PASSWORD=2). */
const PDFJS_NEED_PASSWORD = 1;
const PDFJS_INCORRECT_PASSWORD = 2;

export type StatementApiErrorKind = "pdf_password" | "auth" | "ai" | "other";

export type MappedStatementApiError = {
  kind: StatementApiErrorKind;
  message: string;
  /** Present for PDF password errors so callers can re-attach `err.code`. */
  code?: PdfPasswordErrorCode;
};

/**
 * Map unlock / parse-statement HTTP status + body → UI message.
 * Password failures key off `code` (422/423), never treat bare 401 as wrong password.
 * AI rate-limit / outage after a successful decrypt must not look like incorrect password.
 */
export function mapStatementApiError(
  status: number,
  data: { error?: string; code?: string },
  fallbackMessage: string,
): MappedStatementApiError {
  const code = data.code;

  if (code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT) {
    return {
      kind: "pdf_password",
      message: ERROR_MESSAGES.PDF_PASSWORD_INCORRECT,
      code: STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT,
    };
  }
  if (code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED) {
    return {
      kind: "pdf_password",
      message: ERROR_MESSAGES.PDF_PASSWORD_REQUIRED,
      code: STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED,
    };
  }

  const rawError = typeof data.error === "string" ? data.error.trim() : "";
  const isUnauthorizedCode = code === STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE || rawError === "UNAUTHORIZED";
  if (status === 401 || isUnauthorizedCode) {
    const message =
      rawError && rawError !== "UNAUTHORIZED" && rawError !== STATEMENT_IMPORT.AUTH_UNAUTHORIZED_CODE
        ? rawError
        : ERROR_MESSAGES.AUTH_REQUIRED;
    return { kind: "auth", message };
  }

  if (rawError === GMAIL_ERROR_MESSAGES.UNAUTHORIZED) {
    return { kind: "auth", message: ERROR_MESSAGES.AUTH_REQUIRED };
  }

  if (code === STATEMENT_IMPORT.AI_ERROR_CODES.RATE_LIMITED) {
    return { kind: "ai", message: rawError || ERROR_MESSAGES.AI_RATE_LIMITED };
  }
  if (code === STATEMENT_IMPORT.AI_ERROR_CODES.UNAVAILABLE) {
    return { kind: "ai", message: rawError || ERROR_MESSAGES.AI_UNAVAILABLE };
  }
  if (code === STATEMENT_IMPORT.AI_ERROR_CODES.FAILED) {
    return { kind: "ai", message: rawError || ERROR_MESSAGES.STATEMENT_ALL_CHUNKS_FAILED };
  }

  // Legacy unlock responses returned STATEMENT_ALL_CHUNKS_FAILED without a code.
  if (rawError === ERROR_MESSAGES.STATEMENT_ALL_CHUNKS_FAILED || status === 503) {
    return {
      kind: "ai",
      message: rawError || ERROR_MESSAGES.AI_UNAVAILABLE,
    };
  }

  return { kind: "other", message: rawError || fallbackMessage };
}

/** Thrown when a bank/credit-card PDF needs a password or the supplied one is wrong. */
export class PdfPasswordError extends Error {
  readonly code: PdfPasswordErrorCode;

  constructor(code: PdfPasswordErrorCode, message?: string) {
    super(
      message ??
        (code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT
          ? ERROR_MESSAGES.PDF_PASSWORD_INCORRECT
          : ERROR_MESSAGES.PDF_PASSWORD_REQUIRED),
    );
    this.name = "PdfPasswordError";
    this.code = code;
  }
}

/**
 * Duck-typed check so password errors survive Next.js bundling / duplicate module copies
 * where `instanceof PdfPasswordError` can fail.
 */
export function isPdfPasswordError(err: unknown): err is PdfPasswordError {
  if (err instanceof PdfPasswordError) return true;
  if (!err || typeof err !== "object") return false;
  const candidate = err as { name?: string; code?: string };
  return (
    candidate.name === "PdfPasswordError" &&
    (candidate.code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED ||
      candidate.code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT)
  );
}

export function isPdfPasswordException(err: unknown): err is { name: string; code?: number; message?: string } {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { name?: string; message?: string };
  if (candidate.name === "PasswordException") return true;
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("password") && (message.includes("incorrect") || message.includes("no password"));
}

/**
 * Map pdf.js PasswordException → app codes.
 * Prefer PasswordResponses when present; fall back to numeric codes / supplied password.
 */
export function mapPdfPasswordException(
  err: { code?: number; message?: string },
  password: string | undefined,
  passwordResponses?: { NEED_PASSWORD?: number; INCORRECT_PASSWORD?: number },
): PdfPasswordErrorCode {
  const incorrectCode = passwordResponses?.INCORRECT_PASSWORD ?? PDFJS_INCORRECT_PASSWORD;
  const needCode = passwordResponses?.NEED_PASSWORD ?? PDFJS_NEED_PASSWORD;
  const message = (err.message ?? "").toLowerCase();

  if (err.code === incorrectCode || message.includes("incorrect")) {
    return STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT;
  }
  if (err.code === needCode || message.includes("no password")) {
    return STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED;
  }
  if (password?.trim()) {
    return STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT;
  }
  return STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED;
}
