import { ERROR_MESSAGES } from "@/constants";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, targetAmount, currentAmount } = body;
    const updates = [];
    if (name !== undefined) updates.push(sql`name = ${name}`);
    if (targetAmount !== undefined)
      updates.push(sql`target_amount = ${Number(targetAmount)}`);
    if (currentAmount !== undefined)
      updates.push(sql`current_amount = ${Number(currentAmount)}`);
    if (updates.length === 0) return NextResponse.json(body);
    await sql`UPDATE budgety_savings_goals SET ${sql.join(updates, sql`, `)} WHERE id=${id}`;
    return NextResponse.json(body);
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
    await sql`DELETE FROM budgety_savings_goals WHERE id=${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
