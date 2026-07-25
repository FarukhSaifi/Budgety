import type { UserRecord } from "firebase-admin/auth";
import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "@constants";

import { ADMIN_CLAIM_KEY, ADMIN_USER_ROLES, type AdminUserRole } from "@constants/admin";

import {
  AdminAuthError,
  isAllowlistedUid,
  isEffectiveAdmin,
  requireAdminFromRequest,
  roleFromClaims,
} from "@/lib/adminAuth";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import type { AdminUserListItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PatchBody {
  role?: unknown;
  disabled?: unknown;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isFirebaseAuthNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "auth/user-not-found"
  );
}

function mapAdminError(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) {
    if (err.message === "FIREBASE_ADMIN_NOT_CONFIGURED") {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, err.status);
    }
    if (err.message === "ADMIN_FORBIDDEN") {
      return jsonError(ERROR_MESSAGES.ADMIN_FORBIDDEN, err.status);
    }
    if (err.message === "ADMIN_SELF_MODIFY_BLOCKED") {
      return jsonError(ERROR_MESSAGES.ADMIN_SELF_MODIFY_BLOCKED, err.status);
    }
    if (err.message === "ADMIN_ALLOWLIST_DEMOTE_BLOCKED") {
      return jsonError(ERROR_MESSAGES.ADMIN_ALLOWLIST_DEMOTE_BLOCKED, err.status);
    }
    if (err.message === "ADMIN_ALLOWLIST_DELETE_BLOCKED") {
      return jsonError(ERROR_MESSAGES.ADMIN_ALLOWLIST_DELETE_BLOCKED, err.status);
    }
    if (err.message === "ADMIN_USER_NOT_FOUND") {
      return jsonError(ERROR_MESSAGES.ADMIN_USER_NOT_FOUND, err.status);
    }
    if (err.message === "ADMIN_INVALID_BODY") {
      return jsonError(ERROR_MESSAGES.ADMIN_INVALID_BODY, err.status);
    }
    return jsonError(ERROR_MESSAGES.ADMIN_UNAUTHORIZED, err.status);
  }
  if (isFirebaseAuthNotFound(err)) {
    return jsonError(ERROR_MESSAGES.ADMIN_USER_NOT_FOUND, 404);
  }
  return jsonError(ERROR_MESSAGES.ADMIN_REQUEST_FAILED, 500);
}

function parseRole(value: unknown): AdminUserRole | undefined {
  if (value === undefined) return undefined;
  if (value === ADMIN_USER_ROLES.ADMIN || value === ADMIN_USER_ROLES.USER) {
    return value;
  }
  return undefined;
}

function toListItem(user: UserRecord): AdminUserListItem {
  const claims = (user.customClaims ?? {}) as Record<string, unknown>;
  const role = isEffectiveAdmin(user.uid, claims)
    ? ADMIN_USER_ROLES.ADMIN
    : roleFromClaims(claims);

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    disabled: Boolean(user.disabled),
    role,
    createdAt: user.metadata.creationTime ?? null,
    lastSignInAt: user.metadata.lastSignInTime ?? null,
  };
}

/**
 * PATCH /api/admin/users/[uid]
 * Body: `{ role?: "admin" | "user", disabled?: boolean }`
 *
 * Role uses Auth custom claim `admin`. Allowlisted UIDs stay admin even if
 * claim is cleared (bootstrap owners). Disable uses Auth `disabled` flag.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, 503);
    }

    const actor = await requireAdminFromRequest(request);
    const { uid } = await context.params;
    if (!uid?.trim()) {
      throw new AdminAuthError("ADMIN_INVALID_BODY", 400);
    }

    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      throw new AdminAuthError("ADMIN_INVALID_BODY", 400);
    }

    const role = parseRole(body.role);
    const disabled =
      body.disabled === undefined ? undefined : Boolean(body.disabled);

    if (role === undefined && disabled === undefined) {
      throw new AdminAuthError("ADMIN_INVALID_BODY", 400);
    }

    if (uid === actor.uid && (role === ADMIN_USER_ROLES.USER || disabled === true)) {
      throw new AdminAuthError("ADMIN_SELF_MODIFY_BLOCKED", 400);
    }

    const auth = getAdminAuth();
    const existing = await auth.getUser(uid);

    if (role !== undefined) {
      const nextClaims = { ...(existing.customClaims ?? {}) };
      if (role === ADMIN_USER_ROLES.ADMIN) {
        nextClaims[ADMIN_CLAIM_KEY] = true;
      } else {
        delete nextClaims[ADMIN_CLAIM_KEY];
        // Allowlist UIDs stay admin until removed from ADMIN_UIDS env.
        if (isAllowlistedUid(uid)) {
          throw new AdminAuthError("ADMIN_ALLOWLIST_DEMOTE_BLOCKED", 400);
        }
      }
      await auth.setCustomUserClaims(uid, nextClaims);
    }

    if (disabled !== undefined) {
      await auth.updateUser(uid, { disabled });
    }

    const updated = await auth.getUser(uid);
    return NextResponse.json({ user: toListItem(updated) });
  } catch (err) {
    return mapAdminError(err);
  }
}

/**
 * DELETE /api/admin/users/[uid]
 *
 * Permanently removes the Firebase Auth user. Does not cascade-delete
 * Firestore documents (collections are keyed by `userId` field, not a
 * single profile doc). Self-delete and ADMIN_UIDS allowlist deletes are blocked.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, 503);
    }

    const actor = await requireAdminFromRequest(request);
    const { uid } = await context.params;
    if (!uid?.trim()) {
      throw new AdminAuthError("ADMIN_INVALID_BODY", 400);
    }

    if (uid === actor.uid) {
      throw new AdminAuthError("ADMIN_SELF_MODIFY_BLOCKED", 400);
    }

    if (isAllowlistedUid(uid)) {
      throw new AdminAuthError("ADMIN_ALLOWLIST_DELETE_BLOCKED", 400);
    }

    const auth = getAdminAuth();
    await auth.deleteUser(uid);
    return NextResponse.json({ ok: true, uid });
  } catch (err) {
    return mapAdminError(err);
  }
}
