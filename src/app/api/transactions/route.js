import { ERROR_MESSAGES } from "@/constants";
import { getDb, query } from "@/lib/db";
import { nowISO } from "@/utils/dateUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await query(
      () =>
        sql`SELECT id, type, date::text, mode, description, category, amount, created_at::text, imported FROM budgety_transactions ORDER BY created_at DESC`,
    );
    const transactions = (rows || []).map((r) => ({
      id: r.id,
      type: r.type,
      date: r.date,
      mode: r.mode || "Cash",
      description: r.description,
      category: r.category,
      amount: Number(r.amount),
      createdAt: r.created_at,
      imported: Boolean(r.imported),
    }));
    return NextResponse.json(transactions);
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const body = await request.json();
    const {
      id,
      type,
      date,
      mode,
      description,
      category,
      amount,
      createdAt,
      imported,
    } = body;
    await sql`INSERT INTO budgety_transactions (id, type, date, mode, description, category, amount, created_at, imported)
      VALUES (${id}, ${type}, ${date}, ${mode || "Cash"}, ${description}, ${category}, ${Number(amount)}, ${createdAt || nowISO()}, ${imported ?? false})`;
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
