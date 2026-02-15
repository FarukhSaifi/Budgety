import { getDb } from "@/lib/db";
import { nowISO } from "@/utils/dateUtils";
import { NextResponse } from "next/server";

/**
 * POST /api/transactions/bulk
 * Body: { transactions: Array<{ id, type, date, mode, description, category, amount, createdAt?, imported? }> }
 * Inserts all transactions in a single database transaction (one round-trip).
 */
export async function POST(request) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  try {
    const { transactions: body } = await request.json();
    const list = Array.isArray(body) ? body : [];
    if (list.length === 0) {
      return NextResponse.json(
        { imported: 0, transactions: [] },
        { status: 201 },
      );
    }

    const now = nowISO();
    const inserts = list.map(
      (t) =>
        sql`INSERT INTO budgety_transactions (id, type, date, mode, description, category, amount, created_at, imported)
          VALUES (${t.id}, ${t.type}, ${t.date}, ${t.mode || "Cash"}, ${t.description}, ${t.category}, ${Number(t.amount)}, ${t.createdAt || now}, ${t.imported ?? true})`,
    );

    await sql.transaction(inserts);

    return NextResponse.json(
      { imported: list.length, transactions: list },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
