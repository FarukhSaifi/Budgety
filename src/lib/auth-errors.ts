import { UI_TEXT } from "@constants";

function asAuthError(error: unknown): { code?: string; message?: string } {
  if (error && typeof error === "object") {
    const e = error as { code?: unknown; message?: unknown };
    return {
      code: typeof e.code === "string" ? e.code : undefined,
      message: typeof e.message === "string" ? e.message : undefined,
    };
  }
  if (typeof error === "string") return { message: error };
  return {};
}

/**
 * Map a Firebase Auth error to a user-friendly message from UI_TEXT.
 * Falls back to a generic message for unknown codes.
 */
export function getAuthErrorMessage(error: unknown): string {
  const { code, message } = asAuthError(error);
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS;
    case "auth/email-already-in-use":
      return UI_TEXT.AUTH_ERROR_EMAIL_IN_USE;
    case "auth/weak-password":
      return UI_TEXT.AUTH_ERROR_WEAK_PASSWORD;
    case "auth/invalid-email":
    case "auth/missing-email":
      return UI_TEXT.AUTH_ERROR_INVALID_EMAIL;
    case "auth/too-many-requests":
      return UI_TEXT.AUTH_ERROR_TOO_MANY_REQUESTS;
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return UI_TEXT.AUTH_ERROR_POPUP_CLOSED;
    case "auth/popup-blocked":
      return UI_TEXT.AUTH_ERROR_POPUP_BLOCKED;
    case "auth/unauthorized-domain":
      return UI_TEXT.AUTH_ERROR_UNAUTHORIZED_DOMAIN;
    case "auth/network-request-failed":
      return UI_TEXT.AUTH_ERROR_NETWORK;
    default:
      return message || UI_TEXT.AUTH_GENERIC_ERROR;
  }
}
