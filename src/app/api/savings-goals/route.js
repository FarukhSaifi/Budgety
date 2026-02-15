import { ERROR_MESSAGES } from "@/constants";
import { getDb, query } from "@/lib/db";
import { nowISO } from "@/utils/dateUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await query(
      () =>
        sql`SELECT id, name, target_amount, current_amount, created_at::text FROM budgety_savings_goals ORDER BY created_at DESC`,
    );
    return NextResponse.json(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        targetAmount: Number(r.target_amount),
        currentAmount: Number(r.current_amount),
        createdAt: r.created_at,
      })),
    );
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
    const { id, name, targetAmount, currentAmount, createdAt } = body;
    await sql`INSERT INTO budgety_savings_goals (id, name, target_amount, current_amount, created_at)
      VALUES (${id}, ${name}, ${Number(targetAmount)}, ${Number(currentAmount || 0)}, ${createdAt || nowISO()})`;
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
