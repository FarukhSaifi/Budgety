import { getDb, query } from "@/lib/db";
import { NextResponse } from "next/server";

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
      });
    }
    const [
      transactions,
      savingsGoals,
      budgets,
      recurringTransactions,
      billReminders,
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
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
