"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";
import { cn } from "@utils/cn";
import {
  ElectricBoltIcon,
  MovieIcon,
  ScheduleIcon,
  SubscriptionsIcon,
  WifiIcon,
} from "@components/icons";
import type { IconComponent } from "@components/icons";
import type { Bill } from "@/types";

export interface BillPreviewRowProps {
  bill: Bill;
  formatCurrency: (n: number) => string;
  formatDue: (dueDate: string) => string;
  daysLeft?: number | null;
  onClick?: () => void;
  className?: string;
}

const BILL_ICONS: { match: RegExp; Icon: IconComponent; wrap: string }[] = [
  {
    match: /electric|power|energy|utility/i,
    Icon: ElectricBoltIcon,
    wrap: "bg-amber-50 text-amber-500",
  },
  {
    match: /wifi|internet|broadband|fiber/i,
    Icon: WifiIcon,
    wrap: "bg-sky-50 text-sky-600",
  },
  {
    match: /netflix|spotify|stream|movie|subscription|ott/i,
    Icon: MovieIcon,
    wrap: "bg-violet-50 text-primary-main",
  },
  {
    match: /rent|lease|housing/i,
    Icon: SubscriptionsIcon,
    wrap: "bg-primary-soft text-primary-main",
  },
];

function resolveBillIcon(title: string) {
  const match = BILL_ICONS.find((t) => t.match.test(title));
  if (match) return match;
  return {
    Icon: ScheduleIcon,
    wrap: "bg-primary-soft text-primary-main",
  };
}

export function BillPreviewRow({
  bill,
  formatCurrency,
  formatDue,
  daysLeft,
  onClick,
  className,
}: BillPreviewRowProps) {
  const title = bill.title || bill.name || UI_TEXT.BILLS;
  const { Icon, wrap } = resolveBillIcon(title);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-card",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          wrap,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-deep">{title}</p>
        <p className="truncate text-xs text-gray-400">
          {UI_TEXT.DUE} {formatDue(bill.dueDate)}
          {daysLeft != null && daysLeft >= 0
            ? ` · ${daysLeft} ${UI_TEXT.DAYS_LEFT}`
            : ""}
        </p>
      </div>
      <p className="shrink-0 text-sm font-bold text-brand-deep">
        {CURRENCY_SYMBOL}
        {formatCurrency(bill.amount)}
      </p>
    </button>
  );
}
