import { getDb, query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await query(
      () =>
        sql`SELECT id, type, description, category, amount, recurrence, start_date::text, end_date::text, created_at::text FROM budgety_recurring_transactions ORDER BY created_at DESC`,
    );
    return NextResponse.json(
      (rows || []).map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        category: r.category,
        amount: Number(r.amount),
        recurrence: r.recurrence,
        startDate: r.start_date,
        endDate: r.end_date || null,
        createdAt: r.created_at,
      })),
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  try {
    const body = await request.json();
    const {
      id,
      type,
      description,
      category,
      amount,
      recurrence,
      startDate,
      endDate,
      createdAt,
    } = body;
    await sql`INSERT INTO budgety_recurring_transactions (id, type, description, category, amount, recurrence, start_date, end_date, created_at)
      VALUES (${id}, ${type}, ${description}, ${category}, ${Number(amount)}, ${recurrence}, ${startDate}, ${endDate || null}, ${createdAt || new Date().toISOString()})`;
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
