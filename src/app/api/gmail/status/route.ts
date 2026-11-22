import { NextResponse } from "next/server";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { isGoogleOAuthConfigured } from "@/lib/gmail/googleAuth";
import { getGmailStatus } from "@/lib/gmail/storage";
import { requireOwnedUserId, UserAuthError } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId } = await requireOwnedUserId(request, searchParams.get("userId"));

    const status = await getGmailStatus(userId);
    return NextResponse.json({
      ...status,
      isConfigured: isGoogleOAuthConfigured(),
    });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: GMAIL_ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 });
  }
}
