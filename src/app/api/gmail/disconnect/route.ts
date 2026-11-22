import { NextResponse } from "next/server";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { removeGmailAccount } from "@/lib/gmail/storage";
import { requireOwnedUserId, UserAuthError } from "@/lib/userAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const { userId } = await requireOwnedUserId(request, body.userId);

    await removeGmailAccount(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : GMAIL_ERROR_MESSAGES.DISCONNECT_FAILED },
      { status: 500 },
    );
  }
}
