import { ERROR_MESSAGES } from "@/constants";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const deleted =
      await sql`DELETE FROM budgety_transactions WHERE imported = true RETURNING id`;
    return NextResponse.json({ deleted: deleted.length });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
