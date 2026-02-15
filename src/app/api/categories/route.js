import {
  ERROR_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants";
import { getDb, query } from "@/lib/db";
import { NextResponse } from "next/server";

const INCOME_NAMES = Object.values(INCOME_CATEGORIES);
const EXPENSE_NAMES = Object.values(EXPENSE_CATEGORIES).sort();

async function seedCategoriesIfEmpty(sql) {
  const existing = await query(
    () => sql`SELECT 1 FROM budgety_categories LIMIT 1`,
  ).catch(() => []);
  if (existing && existing.length > 0) return;
  const now = new Date().toISOString();
  for (const name of INCOME_NAMES) {
    await sql`INSERT INTO budgety_categories (id, name, type, created_at)
      VALUES (${crypto.randomUUID()}, ${name}, 'income', ${now})`;
  }
  for (const name of EXPENSE_NAMES) {
    await sql`INSERT INTO budgety_categories (id, name, type, created_at)
      VALUES (${crypto.randomUUID()}, ${name}, 'expense', ${now})`;
  }
}

export async function GET() {
  const sql = getDb();
  try {
    if (!sql) {
      return NextResponse.json({
        income: INCOME_NAMES,
        expense: EXPENSE_NAMES,
      });
    }
    await seedCategoriesIfEmpty(sql);
    const rows = await query(
      () => sql`SELECT name, type FROM budgety_categories ORDER BY type, name`,
    ).catch(() => []);
    const income = (rows || [])
      .filter((r) => r.type === "income")
      .map((r) => r.name);
    const expense = (rows || [])
      .filter((r) => r.type === "expense")
      .map((r) => r.name);
    return NextResponse.json({
      income: income.length ? income : INCOME_NAMES,
      expense: expense.length ? expense : EXPENSE_NAMES,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.DB_NOT_CONFIGURED },
      { status: 503 },
    );
  }
  try {
    const body = await request.json();
    const name =
      typeof body.name === "string" ? body.name.trim().toUpperCase() : "";
    const type =
      body.type === "income" || body.type === "expense" ? body.type : null;
    if (!name || !type) {
      return NextResponse.json(
        { error: "Category name and type (income|expense) are required" },
        { status: 400 },
      );
    }
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await sql`INSERT INTO budgety_categories (id, name, type, created_at)
      VALUES (${id}, ${name}, ${type}, ${createdAt})`;
    return NextResponse.json({ id, name, type, createdAt }, { status: 201 });
  } catch (e) {
    if (e.code === "23505") {
      return NextResponse.json(
        { error: "This category already exists for this type" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
