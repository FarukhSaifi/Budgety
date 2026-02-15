import { getDb, query } from "@/lib/db";
import { nowISO } from "@/utils/dateUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await query(
      () =>
        sql`SELECT id, category, amount, month, year, created_at::text FROM budgety_budgets ORDER BY year DESC, month DESC`,
    );
    return NextResponse.json(
      (rows || []).map((r) => ({
        id: r.id,
        category: r.category,
        amount: Number(r.amount),
        month: r.month,
        year: r.year,
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
    const { id, category, amount, month, year, createdAt } = body;
    await sql`INSERT INTO budgety_budgets (id, category, amount, month, year, created_at)
      VALUES (${id}, ${category}, ${Number(amount)}, ${month}, ${year}, ${createdAt || nowISO()})`;
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
