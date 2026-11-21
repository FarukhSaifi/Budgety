import { NextResponse } from "next/server";

import { GMAIL_DEFAULTS } from "@constants";

import { updateAutoSyncSettings } from "@/lib/gmail/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      autoSyncEnabled?: boolean;
      autoSyncIntervalHours?: number;
    };
    const userId = body.userId || GMAIL_DEFAULTS.DEFAULT_USER_ID;

    await updateAutoSyncSettings(userId, {
      autoSyncEnabled: body.autoSyncEnabled,
      autoSyncIntervalHours: body.autoSyncIntervalHours,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update settings" },
      { status: 500 },
    );
  }
}
