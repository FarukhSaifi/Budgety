import { NextResponse } from "next/server";

import { GMAIL_ENDPOINTS, GMAIL_ERROR_MESSAGES } from "@constants";

import { APP_ROUTES } from "@constants/routes";

import { exchangeCodeForTokens } from "@/lib/gmail/googleAuth";
import { verifyOAuthState } from "@/lib/gmail/oauthState";
import { saveGmailTokens } from "@/lib/gmail/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function importRedirect(request: Request, params: Record<string, string>): NextResponse {
  const url = new URL(APP_ROUTES.transactionsImport, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${proto}://${host}/api/auth/gmail/callback`;

  if (error || !code) {
    return importRedirect(request, {
      gmail_error: GMAIL_ERROR_MESSAGES.OAUTH_CONNECT_FAILED,
    });
  }

  const userId = verifyOAuthState(state);
  if (!userId) {
    return importRedirect(request, {
      gmail_error: GMAIL_ERROR_MESSAGES.OAUTH_STATE_INVALID,
    });
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    let email: string | null = null;
    try {
      const userinfoRes = await fetch(GMAIL_ENDPOINTS.USERINFO, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userInfo = (await userinfoRes.json()) as { email?: string };
        email = userInfo.email || null;
      }
    } catch {
      // Non-fatal if userinfo fails
    }

    await saveGmailTokens(userId, {
      refreshToken: tokens.refresh_token || "",
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      email,
    });

    return importRedirect(request, {
      gmail: "connected",
      email: email || "",
    });
  } catch {
    return importRedirect(request, {
      gmail_error: GMAIL_ERROR_MESSAGES.OAUTH_CONNECT_FAILED,
    });
  }
}
