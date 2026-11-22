import { NextResponse } from "next/server";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/gmail/googleAuth";
import { createOAuthState } from "@/lib/gmail/oauthState";
import { requireOwnedUserId, UserAuthError } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId } = await requireOwnedUserId(request, searchParams.get("userId"));

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

    const state = createOAuthState(userId);
    const url = buildGoogleAuthUrl(state, redirectUri);
    return NextResponse.json({ url, isConfigured: true });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: GMAIL_ERROR_MESSAGES.OAUTH_NOT_CONFIGURED }, { status: 500 });
  }
}
