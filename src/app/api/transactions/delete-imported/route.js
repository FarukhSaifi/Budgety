import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  try {
    const deleted =
      await sql`DELETE FROM budgety_transactions WHERE imported = true RETURNING id`;
    return NextResponse.json({ deleted: deleted.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
