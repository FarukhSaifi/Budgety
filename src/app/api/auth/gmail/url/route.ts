import { NextResponse } from "next/server";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/gmail/googleAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: GMAIL_ERROR_MESSAGES.OAUTH_NOT_CONFIGURED,
        isConfigured: false,
      },
      { status: 503 },
    );
  }

  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${proto}://${host}/api/auth/gmail/callback`;

  const url = buildGoogleAuthUrl(userId, redirectUri);
  return NextResponse.json({ url, isConfigured: true });
}
