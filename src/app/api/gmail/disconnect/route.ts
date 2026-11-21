import { NextResponse } from "next/server";

import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";

import { removeGmailAccount } from "@/lib/gmail/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const userId = body.userId || GMAIL_DEFAULTS.DEFAULT_USER_ID;

    await removeGmailAccount(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : GMAIL_ERROR_MESSAGES.DISCONNECT_FAILED },
      { status: 500 },
    );
  }
}
