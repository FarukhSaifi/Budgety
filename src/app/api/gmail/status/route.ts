import { NextResponse } from "next/server";

import { GMAIL_DEFAULTS } from "@constants";

import { isGoogleOAuthConfigured } from "@/lib/gmail/googleAuth";
import { getGmailStatus } from "@/lib/gmail/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || GMAIL_DEFAULTS.DEFAULT_USER_ID;

  const status = await getGmailStatus(userId);
  return NextResponse.json({
    ...status,
    isConfigured: isGoogleOAuthConfigured(),
  });
}
