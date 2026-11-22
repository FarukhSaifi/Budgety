import type { DecodedIdToken } from "firebase-admin/auth";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export class UserAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UserAuthError";
    this.status = status;
  }
}

/** Verify Firebase ID token from `Authorization: Bearer <token>`. */
export async function requireUserFromRequest(request: Request): Promise<DecodedIdToken> {
  if (!isFirebaseAdminConfigured()) {
    throw new UserAuthError("FIREBASE_ADMIN_NOT_CONFIGURED", 503);
  }

  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UserAuthError(GMAIL_ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new UserAuthError(GMAIL_ERROR_MESSAGES.UNAUTHORIZED, 401);
  }

  try {
    return await getAdminAuth().verifyIdToken(idToken);
  } catch {
    throw new UserAuthError(GMAIL_ERROR_MESSAGES.UNAUTHORIZED, 401);
  }
}

/**
 * Require a signed-in user and ensure the requested `userId` matches the token uid.
 * Ignores client-supplied ids that do not match (prevents IDOR).
 */
export async function requireOwnedUserId(
  request: Request,
  requestedUserId?: string | null,
): Promise<{ decoded: DecodedIdToken; userId: string }> {
  const decoded = await requireUserFromRequest(request);
  const requested = requestedUserId?.trim();

  if (requested && requested !== decoded.uid) {
    throw new UserAuthError(GMAIL_ERROR_MESSAGES.USER_MISMATCH, 403);
  }

  return { decoded, userId: decoded.uid };
}
