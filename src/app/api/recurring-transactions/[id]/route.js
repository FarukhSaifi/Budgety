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
    const {
      type,
      description,
      category,
      amount,
      recurrence,
      startDate,
      endDate,
    } = body;
    await sql`UPDATE budgety_recurring_transactions SET type=${type}, description=${description}, category=${category}, amount=${Number(amount)}, recurrence=${recurrence}, start_date=${startDate}, end_date=${endDate ?? null} WHERE id=${id}`;
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
    await sql`DELETE FROM budgety_recurring_transactions WHERE id=${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
