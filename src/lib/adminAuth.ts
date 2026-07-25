import type { DecodedIdToken } from "firebase-admin/auth";

import {
  ADMIN_CLAIM_KEY,
  ADMIN_UIDS_ENV,
  ADMIN_USER_ROLES,
  type AdminUserRole,
} from "@constants/admin";

import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function parseAdminUidAllowlist(): Set<string> {
  const raw = process.env[ADMIN_UIDS_ENV] ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** True when token has `admin` claim or UID is in `ADMIN_UIDS`. */
export function isAdminFromToken(decoded: DecodedIdToken): boolean {
  if (decoded[ADMIN_CLAIM_KEY] === true) return true;
  return parseAdminUidAllowlist().has(decoded.uid);
}

export function roleFromClaims(claims: Record<string, unknown> | undefined): AdminUserRole {
  if (claims?.[ADMIN_CLAIM_KEY] === true) return ADMIN_USER_ROLES.ADMIN;
  return ADMIN_USER_ROLES.USER;
}

export function isAllowlistedUid(uid: string): boolean {
  return parseAdminUidAllowlist().has(uid);
}

/** Effective admin: custom claim OR server allowlist (for list UI badges). */
export function isEffectiveAdmin(
  uid: string,
  claims: Record<string, unknown> | undefined,
): boolean {
  if (claims?.[ADMIN_CLAIM_KEY] === true) return true;
  return isAllowlistedUid(uid);
}

export async function requireAdminFromRequest(request: Request): Promise<DecodedIdToken> {
  if (!isFirebaseAdminConfigured()) {
    throw new AdminAuthError("FIREBASE_ADMIN_NOT_CONFIGURED", 503);
  }

  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AdminAuthError("ADMIN_UNAUTHORIZED", 401);
  }

  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new AdminAuthError("ADMIN_UNAUTHORIZED", 401);
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    throw new AdminAuthError("ADMIN_UNAUTHORIZED", 401);
  }

  if (!isAdminFromToken(decoded)) {
    throw new AdminAuthError("ADMIN_FORBIDDEN", 403);
  }

  return decoded;
}
