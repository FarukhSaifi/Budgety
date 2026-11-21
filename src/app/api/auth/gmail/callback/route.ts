import { NextResponse } from "next/server";

import { GMAIL_DEFAULTS, GMAIL_ENDPOINTS } from "@constants";

import { exchangeCodeForTokens } from "@/lib/gmail/googleAuth";
import { saveGmailTokens } from "@/lib/gmail/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId passed as state
  const error = searchParams.get("error");

  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${proto}://${host}/api/auth/gmail/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      new URL(
        `/transactions/import?gmail_error=${encodeURIComponent(error || "No authorization code provided")}`,
        request.url,
      ),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Fetch user profile to get connected Gmail email address
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

    const userId = state || GMAIL_DEFAULTS.DEFAULT_USER_ID;
    await saveGmailTokens(userId, {
      refreshToken: tokens.refresh_token || "",
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      email,
    });

    return NextResponse.redirect(
      new URL(`/transactions/import?gmail=connected&email=${encodeURIComponent(email || "")}`, request.url),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect Gmail";
    return NextResponse.redirect(
      new URL(`/transactions/import?gmail_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
