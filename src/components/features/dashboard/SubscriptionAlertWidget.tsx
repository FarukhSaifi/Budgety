"use client";

import { useMemo } from "react";

import { UI_TEXT } from "@constants";

import { NotificationsIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";

const SUBSCRIPTION_HINT =
  /netflix|spotify|prime|apple|youtube|subscription|disney|hotstar|hulu|adobe|gym|membership/i;

function daysUntil(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Flags recurring subscriptions renewing within 3 days. */
export function SubscriptionAlertWidget() {
  const bills = useAppSelector((s) => s.bills.items);
  const recurring = useAppSelector((s) => s.recurring.items);
  const { formatCurrency } = useCurrencyFormatter();

  const alerts = useMemo(() => {
    const fromBills = bills
      .filter((b) => !b.isPaid && b.status !== "paid")
      .map((b) => {
        const days = daysUntil(b.dueDate);
        const title = b.title || b.name || "";
        const isSub =
          SUBSCRIPTION_HINT.test(title) ||
          (b.category ? SUBSCRIPTION_HINT.test(b.category) : false) ||
          b.recurrence === "monthly" ||
          b.recurrence === "yearly";
        if (!isSub || days == null || days < 0 || days > 3) return null;
        return { id: b.id, title, amount: b.amount, days };
      })
      .filter(Boolean) as Array<{ id: string; title: string; amount: number; days: number }>;

    const fromRecurring = recurring
      .filter((r) => r.isActive !== false && r.type === "expense")
      .map((r) => {
        if (!SUBSCRIPTION_HINT.test(r.description) && !SUBSCRIPTION_HINT.test(r.category)) {
          return null;
        }
        const days = daysUntil(r.startDate);
        if (days == null || days < 0 || days > 3) return null;
        return { id: r.id, title: r.description, amount: r.amount, days };
      })
      .filter(Boolean) as Array<{ id: string; title: string; amount: number; days: number }>;

    const seen = new Set<string>();
    return [...fromBills, ...fromRecurring].filter((a) => {
      const key = a.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [bills, recurring]);

  if (alerts.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-card md:p-5">
      <div className="mb-2 flex items-center gap-2">
        <NotificationsIcon className="h-5 w-5 text-amber-700" />
        <h3 className="text-sm font-bold text-amber-900">{UI_TEXT.SUBSCRIPTION_ALERTS}</h3>
      </div>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium text-brand-deep">{a.title}</span>
            <span className="shrink-0 text-on-surface-variant">
              ₹{formatCurrency(a.amount)} · {a.days === 0 ? "today" : `${a.days}d`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
