import { DATE_CONSTANTS, RECURRENCE_LABELS, UI_TEXT } from "@constants";

import type { IconComponent } from "@components/icons";
import {
  ApartmentIcon,
  ElectricBoltIcon,
  FitnessCenterIcon,
  MovieIcon,
  RouterIcon,
  ScheduleIcon,
  WifiIcon,
} from "@components/icons";

import type { Bill, BillStatus } from "@/types";

export type BillTab = "upcoming" | "paid" | "all";

export type BillDisplayStatus = "overdue" | "upcoming" | "auto_pay" | "paid";

export interface BillIconTheme {
  Icon: IconComponent;
  wrap: string;
}

const BILL_ICONS: { match: RegExp; Icon: IconComponent; wrap: string }[] = [
  {
    match: /electric|power|energy|utility|bolt/i,
    Icon: ElectricBoltIcon,
    wrap: "bg-sky-100 text-sky-700",
  },
  {
    match: /wifi|internet|broadband|fiber|router|xfinity/i,
    Icon: WifiIcon,
    wrap: "bg-rose-100 text-expense",
  },
  {
    match: /gym|fitness|workout|equinox/i,
    Icon: FitnessCenterIcon,
    wrap: "bg-surface-high text-brand-deep",
  },
  {
    match: /rent|lease|housing|apartment|home/i,
    Icon: ApartmentIcon,
    wrap: "bg-surface-high text-brand-deep",
  },
  {
    match: /netflix|spotify|stream|movie|subscription|ott/i,
    Icon: MovieIcon,
    wrap: "bg-primary-soft text-primary-main",
  },
  {
    match: /router|modem/i,
    Icon: RouterIcon,
    wrap: "bg-rose-100 text-expense",
  },
];

export function resolveBillIcon(title: string, category?: string): BillIconTheme {
  const haystack = `${title} ${category ?? ""}`;
  const match = BILL_ICONS.find((t) => t.match.test(haystack));
  if (match) return { Icon: match.Icon, wrap: match.wrap };
  return { Icon: ScheduleIcon, wrap: "bg-primary-soft text-primary-main" };
}

export function daysUntilDue(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round(
    (due.getTime() - now.getTime()) / DATE_CONSTANTS.MILLISECONDS_PER_DAY,
  );
}

export function isBillPaid(bill: Bill): boolean {
  return Boolean(bill.isPaid) || bill.status === "paid";
}

export function resolveBillStatus(bill: Bill): BillStatus {
  if (isBillPaid(bill)) return "paid";
  if (bill.status === "overdue") return "overdue";
  const days = daysUntilDue(bill.dueDate);
  if (days != null && days < 0) return "overdue";
  return bill.status === "pending" ? "pending" : "pending";
}

export function resolveDisplayStatus(bill: Bill): BillDisplayStatus {
  if (isBillPaid(bill)) return "paid";
  const status = resolveBillStatus(bill);
  if (status === "overdue") return "overdue";
  return "upcoming";
}

export function billTitle(bill: Bill): string {
  return bill.title || bill.name || UI_TEXT.BILLS;
}

export function billVendor(bill: Bill): string {
  if (bill.category) return bill.category;
  const recurrence = bill.recurrence
    ? RECURRENCE_LABELS[bill.recurrence] || bill.recurrence
    : null;
  return recurrence || UI_TEXT.RECURRING_BILL;
}

export function formatDueRelative(dueDate: string): string {
  const days = daysUntilDue(dueDate);
  if (days == null) return "";
  if (days === 0) return UI_TEXT.DUE_TODAY;
  if (days === 1) return UI_TEXT.DUE_IN_ONE_DAY;
  if (days === -1) return UI_TEXT.DUE_ONE_DAY_AGO;
  if (days > 0) return UI_TEXT.DUE_IN_DAYS.replace("{n}", String(days));
  return UI_TEXT.DUE_DAYS_AGO.replace("{n}", String(Math.abs(days)));
}

export function formatDueShortLabel(dueDate: string): string {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return dueDate;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatTimelineDate(dueDate: string, overdue: boolean): string {
  const base = formatDueShortLabel(dueDate);
  if (overdue) return `${base} (${UI_TEXT.OVERDUE})`;
  return base;
}

export function displayStatusLabel(status: BillDisplayStatus): string {
  switch (status) {
    case "overdue":
      return UI_TEXT.STATUS_OVERDUE;
    case "auto_pay":
      return UI_TEXT.STATUS_AUTO_PAY;
    case "paid":
      return UI_TEXT.STATUS_PAID;
    default:
      return UI_TEXT.STATUS_UPCOMING;
  }
}

export function filterBillsByTab(bills: Bill[], tab: BillTab): Bill[] {
  return bills.filter((b) => {
    const paid = isBillPaid(b);
    if (tab === "paid") return paid;
    if (tab === "upcoming") return !paid;
    return true;
  });
}

export function sortBillsByDue(bills: Bill[]): Bill[] {
  return [...bills].sort((a, b) => {
    const da = new Date(a.dueDate).getTime();
    const db = new Date(b.dueDate).getTime();
    return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
  });
}

export function matchesBillSearch(bill: Bill, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${billTitle(bill)} ${bill.category ?? ""} ${bill.recurrence ?? ""}`.toLowerCase();
  return hay.includes(q);
}

/** Unpaid bills due within the next N days (includes overdue). */
export function billsDueWithinDays(bills: Bill[], days: number): Bill[] {
  return bills.filter((b) => {
    if (isBillPaid(b)) return false;
    const d = daysUntilDue(b.dueDate);
    if (d == null) return false;
    return d <= days;
  });
}

/** Unpaid bills with due date in the given calendar month. */
export function unpaidBillsInMonth(
  bills: Bill[],
  month: number,
  year: number,
): Bill[] {
  return bills.filter((b) => {
    if (isBillPaid(b)) return false;
    const d = new Date(b.dueDate);
    if (Number.isNaN(d.getTime())) return false;
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
}

export function sumAmounts(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + (b.amount || 0), 0);
}
