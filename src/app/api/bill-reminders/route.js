import { getDb, query } from "@/lib/db";
import { nowISO } from "@/utils/dateUtils";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await query(
      () =>
        sql`SELECT id, name, category, amount, due_date::text, reminder_days, is_recurring, recurrence, is_paid, paid_date::text, created_at::text FROM budgety_bill_reminders ORDER BY due_date ASC`,
    );
    return NextResponse.json(
      (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        amount: Number(r.amount),
        dueDate: r.due_date,
        reminderDays: r.reminder_days,
        isRecurring: Boolean(r.is_recurring),
        recurrence: r.recurrence || null,
        isPaid: Boolean(r.is_paid),
        paidDate: r.paid_date || null,
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
      name,
      category,
      amount,
      dueDate,
      reminderDays,
      isRecurring,
      recurrence,
      createdAt,
    } = body;
    await sql`INSERT INTO budgety_bill_reminders (id, name, category, amount, due_date, reminder_days, is_recurring, recurrence, created_at)
      VALUES (${id}, ${name}, ${category}, ${Number(amount)}, ${dueDate}, ${reminderDays ?? 3}, ${isRecurring ?? false}, ${recurrence ?? null}, ${createdAt || nowISO()})`;
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
