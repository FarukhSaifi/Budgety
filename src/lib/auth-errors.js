import { UI_TEXT } from "@constants";

/**
 * Map a Firebase Auth error to a user-friendly message from UI_TEXT.
 * Falls back to a generic message for unknown codes.
 */
export function getAuthErrorMessage(error) {
  switch (error?.code) {
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
    case "auth/network-request-failed":
      return UI_TEXT.AUTH_ERROR_NETWORK;
    default:
      return error?.message || UI_TEXT.AUTH_GENERIC_ERROR;
  }
}
