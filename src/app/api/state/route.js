import {
  ERROR_MESSAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants";
import { getDb, query } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULT_INCOME = Object.values(INCOME_CATEGORIES);
const DEFAULT_EXPENSE = Object.values(EXPENSE_CATEGORIES).sort();

async function seedCategoriesIfEmpty(sql) {
  const existing = await query(
    () => sql`SELECT 1 FROM budgety_categories LIMIT 1`,
  ).catch(() => []);
  if (existing && existing.length > 0) return;
  const now = new Date().toISOString();
  for (const name of DEFAULT_INCOME) {
    await sql`INSERT INTO budgety_categories (id, name, type, created_at)
      VALUES (${crypto.randomUUID()}, ${name}, 'income', ${now})`;
  }
  for (const name of DEFAULT_EXPENSE) {
    await sql`INSERT INTO budgety_categories (id, name, type, created_at)
      VALUES (${crypto.randomUUID()}, ${name}, 'expense', ${now})`;
  }
}

async function getCategoriesFromDb(sql) {
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
  return {
    income: income.length ? income : DEFAULT_INCOME,
    expense: expense.length ? expense : DEFAULT_EXPENSE,
  };
}

export async function GET() {
  const sql = getDb();
  try {
    if (!sql) {
      return NextResponse.json({
        transactions: [],
        savingsGoals: [],
        budgets: [],
        recurringTransactions: [],
        billReminders: [],
        categories: { income: DEFAULT_INCOME, expense: DEFAULT_EXPENSE },
      });
    }
    const [
      transactions,
      savingsGoals,
      budgets,
      recurringTransactions,
      billReminders,
      categories,
    ] = await Promise.all([
      query(
        () =>
          sql`SELECT id, type, date::text, mode, description, category, amount, created_at::text, imported FROM budgety_transactions ORDER BY created_at DESC`,
      ),
      query(
        () =>
          sql`SELECT id, name, target_amount, current_amount, created_at::text FROM budgety_savings_goals ORDER BY created_at DESC`,
      ),
      query(
        () =>
          sql`SELECT id, category, amount, month, year, created_at::text FROM budgety_budgets ORDER BY year DESC, month DESC`,
      ),
      query(
        () =>
          sql`SELECT id, type, description, category, amount, recurrence, start_date::text, end_date::text, created_at::text FROM budgety_recurring_transactions ORDER BY created_at DESC`,
      ),
      query(
        () =>
          sql`SELECT id, name, category, amount, due_date::text, reminder_days, is_recurring, recurrence, is_paid, paid_date::text, created_at::text FROM budgety_bill_reminders ORDER BY due_date ASC`,
      ),
      getCategoriesFromDb(sql).catch(() => ({
        income: DEFAULT_INCOME,
        expense: DEFAULT_EXPENSE,
      })),
    ]);
    return NextResponse.json({
      transactions: (transactions || []).map((r) => ({
        id: r.id,
        type: r.type,
        date: r.date,
        mode: r.mode || "Cash",
        description: r.description,
        category: r.category,
        amount: Number(r.amount),
        createdAt: r.created_at,
        imported: Boolean(r.imported),
      })),
      savingsGoals: (savingsGoals || []).map((r) => ({
        id: r.id,
        name: r.name,
        targetAmount: Number(r.target_amount),
        currentAmount: Number(r.current_amount),
        createdAt: r.created_at,
      })),
      budgets: (budgets || []).map((r) => ({
        id: r.id,
        category: r.category,
        amount: Number(r.amount),
        month: r.month,
        year: r.year,
        createdAt: r.created_at,
      })),
      recurringTransactions: (recurringTransactions || []).map((r) => ({
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
      billReminders: (billReminders || []).map((r) => ({
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
      categories: categories || {
        income: DEFAULT_INCOME,
        expense: DEFAULT_EXPENSE,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
