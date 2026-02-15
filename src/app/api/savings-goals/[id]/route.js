import { ERROR_MESSAGES } from "@/constants";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

function toGoal(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    targetAmount: Number(r.target_amount),
    currentAmount: Number(r.current_amount),
    createdAt: r.created_at,
  };
}

export async function GET(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const { id } = await params;
    const rows = await sql`
      SELECT id, name, target_amount, current_amount, created_at::text
      FROM budgety_savings_goals
      WHERE id = ${id}
    `;
    const row = rows?.[0];
    if (!row)
      return NextResponse.json(
        { error: "Savings goal not found" },
        { status: 404 },
      );
    return NextResponse.json(toGoal(row));
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const { id } = await params;
    const existing = await sql`
      SELECT id FROM budgety_savings_goals WHERE id = ${id}
    `;
    if (!existing?.length)
      return NextResponse.json(
        { error: "Savings goal not found" },
        { status: 404 },
      );
    const body = await request.json();
    const { name, targetAmount, currentAmount } = body;
    const hasUpdates =
      name !== undefined ||
      targetAmount !== undefined ||
      currentAmount !== undefined;
    if (hasUpdates) {
      if (name !== undefined)
        await sql`UPDATE budgety_savings_goals SET name = ${name} WHERE id = ${id}`;
      if (targetAmount !== undefined)
        await sql`UPDATE budgety_savings_goals SET target_amount = ${Number(targetAmount)} WHERE id = ${id}`;
      if (currentAmount !== undefined)
        await sql`UPDATE budgety_savings_goals SET current_amount = ${Number(currentAmount)} WHERE id = ${id}`;
    }
    const [row] = await sql`
      SELECT id, name, target_amount, current_amount, created_at::text
      FROM budgety_savings_goals WHERE id = ${id}
    `;
    return NextResponse.json(toGoal(row) || body);
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const { id } = await params;
    const existing = await sql`
      SELECT id FROM budgety_savings_goals WHERE id = ${id}
    `;
    if (!existing?.length)
      return NextResponse.json(
        { error: "Savings goal not found" },
        { status: 404 },
      );
    await sql`DELETE FROM budgety_savings_goals WHERE id=${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
