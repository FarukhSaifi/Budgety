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
      name,
      category,
      amount,
      dueDate,
      reminderDays,
      isRecurring,
      recurrence,
      isPaid,
      paidDate,
    } = body;
    const setClause = [];
    if (name !== undefined) setClause.push(sql`name = ${name}`);
    if (category !== undefined) setClause.push(sql`category = ${category}`);
    if (amount !== undefined) setClause.push(sql`amount = ${Number(amount)}`);
    if (dueDate !== undefined) setClause.push(sql`due_date = ${dueDate}`);
    if (reminderDays !== undefined)
      setClause.push(sql`reminder_days = ${reminderDays}`);
    if (isRecurring !== undefined)
      setClause.push(sql`is_recurring = ${isRecurring}`);
    if (recurrence !== undefined)
      setClause.push(sql`recurrence = ${recurrence}`);
    if (isPaid !== undefined) setClause.push(sql`is_paid = ${isPaid}`);
    if (paidDate !== undefined) setClause.push(sql`paid_date = ${paidDate}`);
    if (setClause.length === 0) return NextResponse.json(body);
    await sql`UPDATE budgety_bill_reminders SET ${sql.join(setClause, sql`, `)} WHERE id=${id}`;
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
    await sql`DELETE FROM budgety_bill_reminders WHERE id=${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
