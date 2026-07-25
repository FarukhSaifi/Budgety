import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "@constants";

import { AdminAuthError, requireAdminFromRequest } from "@/lib/adminAuth";
import { isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

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

/** GET /api/admin/me — whether the caller can access admin APIs. */
export async function GET(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(ERROR_MESSAGES.ADMIN_SDK_NOT_CONFIGURED, 503);
    }
    const decoded = await requireAdminFromRequest(request);
    return NextResponse.json({
      isAdmin: true,
      uid: decoded.uid,
    });
  } catch (err) {
    return mapAdminError(err);
  }
}
