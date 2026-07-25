import type { UserRecord } from "firebase-admin/auth";
import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "@constants";

import {
  ADMIN_USERS_MAX_SCAN,
  ADMIN_USERS_PAGE_SIZE,
  ADMIN_USER_ROLES,
} from "@constants/admin";

import {
  AdminAuthError,
  isEffectiveAdmin,
  requireAdminFromRequest,
  roleFromClaims,
} from "@/lib/adminAuth";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import type { AdminUserListItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function mapAdminError(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) {
    if (err.message === "FIREBASE_ADMIN_NOT_CONFIGURED") {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, err.status);
    }
    if (err.message === "ADMIN_FORBIDDEN") {
      return jsonError(ERROR_MESSAGES.ADMIN_FORBIDDEN, err.status);
    }
    return jsonError(ERROR_MESSAGES.ADMIN_UNAUTHORIZED, err.status);
  }
  return jsonError(ERROR_MESSAGES.ADMIN_REQUEST_FAILED, 500);
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

/** GET /api/admin/users?q=&pageToken= — list Auth users (Admin SDK). */
export async function GET(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, 503);
    }
    await requireAdminFromRequest(request);

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const pageToken = url.searchParams.get("pageToken") ?? undefined;

    const auth = getAdminAuth();

    // Search needs a multi-page scan; plain list uses a single page + token.
    if (q) {
      const matched: AdminUserListItem[] = [];
      let token: string | undefined;
      let scanned = 0;

      do {
        const page = await auth.listUsers(ADMIN_USERS_PAGE_SIZE, token);
        scanned += page.users.length;
        for (const user of page.users) {
          const item = toListItem(user);
          const haystack = `${item.email ?? ""} ${item.displayName ?? ""} ${item.uid}`.toLowerCase();
          if (haystack.includes(q)) matched.push(item);
        }
        token = page.pageToken;
      } while (token && scanned < ADMIN_USERS_MAX_SCAN);

      return NextResponse.json({
        users: matched,
        nextPageToken: null,
        truncated: scanned >= ADMIN_USERS_MAX_SCAN && Boolean(token),
      });
    }

    const page = await auth.listUsers(ADMIN_USERS_PAGE_SIZE, pageToken);
    return NextResponse.json({
      users: page.users.map(toListItem),
      nextPageToken: page.pageToken ?? null,
      truncated: false,
    });
  } catch (err) {
    return mapAdminError(err);
  }
}
