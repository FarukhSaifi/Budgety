import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, date, mode, description, category, amount } = body;
    await sql`UPDATE budgety_transactions SET type=${type}, date=${date}, mode=${mode ?? "Cash"}, description=${description}, category=${category}, amount=${Number(amount)} WHERE id=${id}`;
    return NextResponse.json({ id, ...body });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const sql = getDb();
  if (!sql)
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  try {
    const { id } = await params;
    await sql`DELETE FROM budgety_transactions WHERE id=${id}`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
