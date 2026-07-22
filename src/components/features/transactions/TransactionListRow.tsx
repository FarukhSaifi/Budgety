"use client";

import { Badge } from "@common";
import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";
import {
  AccountBalanceIcon,
  ApartmentIcon,
  CommuteIcon,
  CreditCardIcon,
  DirectionsCarIcon,
  FileDownloadIcon,
  FitnessCenterIcon,
  FlightTakeoffIcon,
  HealthAndSafetyIcon,
  LocalCafeIcon,
  MovieIcon,
  PaymentsIcon,
  RestaurantIcon,
  SavingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SubscriptionsIcon,
  WalletIcon,
  WifiIcon,
  WorkIcon,
} from "@components/icons";
import type { IconComponent } from "@components/icons";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { cn } from "@utils/cn";
import type { Transaction } from "@/types";

/** Shared category tiles for list + dashboard recent rows (Stitch Material Symbols). */
const ICON_TILES: {
  match: RegExp;
  Icon: IconComponent;
  wrap: string;
  badge: string;
}[] = [
  {
    match: /salary|payroll|freelance|bonus|paycheck/i,
    Icon: WorkIcon,
    wrap: "bg-income-soft text-income",
    badge: "bg-income-soft text-income",
  },
  {
    match: /income|deposit|credit\s*salary/i,
    Icon: PaymentsIcon,
    wrap: "bg-income-soft text-income",
    badge: "bg-income-soft text-income",
  },
  {
    match: /credit\s*card/i,
    Icon: CreditCardIcon,
    wrap: "bg-violet-50 text-primary-main",
    badge: "bg-primary-soft text-primary-dark",
  },
  {
    match: /bond|elss|mutual|sip|invest|equity|stock/i,
    Icon: AccountBalanceIcon,
    wrap: "bg-income-soft text-income",
    badge: "bg-income-soft text-income",
  },
  {
    match: /saving|emergency\s*fund/i,
    Icon: SavingsIcon,
    wrap: "bg-income-soft text-income",
    badge: "bg-income-soft text-income",
  },
  {
    match: /restaurant|dining|food|meal|swiggy|zomato/i,
    Icon: RestaurantIcon,
    wrap: "bg-sky-50 text-sky-700",
    badge: "bg-primary-soft text-primary-dark",
  },
  {
    match: /cafe|coffee|starbucks/i,
    Icon: LocalCafeIcon,
    wrap: "bg-amber-50 text-amber-700",
    badge: "bg-amber-50 text-amber-800",
  },
  {
    match: /insurance|hospital|pharmacy|clinic|medical/i,
    Icon: HealthAndSafetyIcon,
    wrap: "bg-rose-50 text-rose-700",
    badge: "bg-rose-50 text-rose-700",
  },
  {
    match: /gym|fitness|equinox|sport|healthcare|health/i,
    Icon: FitnessCenterIcon,
    wrap: "bg-violet-50 text-primary-main",
    badge: "bg-violet-50 text-primary-dark",
  },
  {
    match: /netflix|spotify|prime|subscription|ott/i,
    Icon: SubscriptionsIcon,
    wrap: "bg-violet-50 text-primary-main",
    badge: "bg-primary-soft text-primary-dark",
  },
  {
    match: /movie|cinema|entertainment|pvr/i,
    Icon: MovieIcon,
    wrap: "bg-fuchsia-50 text-fuchsia-700",
    badge: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    match: /wifi|internet|broadband|airtel|jio|fiber/i,
    Icon: WifiIcon,
    wrap: "bg-sky-50 text-sky-700",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /rent|housing|apartment|home\s*loan|emi/i,
    Icon: ApartmentIcon,
    wrap: "bg-amber-50 text-amber-800",
    badge: "bg-amber-50 text-amber-800",
  },
  {
    match: /flight|airport|airline|trip|vacation|travel/i,
    Icon: FlightTakeoffIcon,
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /apple|download|software|tech|electronics/i,
    Icon: FileDownloadIcon,
    wrap: "bg-primary-light text-white",
    badge: "bg-primary-soft text-primary-main",
  },
  {
    match: /mall|shopping\s*bag|myntra|ajio/i,
    Icon: ShoppingBagIcon,
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /shop|amazon|flipkart|store|cart|retail|grocery/i,
    Icon: ShoppingCartIcon,
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /metro|bus|train|commute/i,
    Icon: CommuteIcon,
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /uber|ola|fuel|petrol|transport|\bcar\b/i,
    Icon: DirectionsCarIcon,
    wrap: "bg-sky-50 text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  },
  {
    match: /transfer|upi|bank|neft|imps|payment/i,
    Icon: PaymentsIcon,
    wrap: "bg-amber-50 text-amber-700",
    badge: "bg-amber-50 text-amber-800",
  },
];

export function resolveTransactionIconTile(transaction: Transaction) {
  const haystack = `${transaction.category || ""} ${transaction.title || ""} ${transaction.description || ""}`;
  const match = ICON_TILES.find((tile) => tile.match.test(haystack));
  const isIncome = transaction.type === "income";
  if (match) {
    // Keep chip colors aligned with transaction type (e.g. SIP expense ≠ income green).
    const usesIncomeFill = match.wrap.includes("income");
    if (!isIncome && usesIncomeFill) {
      return {
        ...match,
        wrap: "bg-expense-soft text-expense",
        badge: "bg-expense-soft text-expense",
      };
    }
    if (isIncome && match.wrap.includes("rose")) {
      return {
        ...match,
        wrap: "bg-income-soft text-income",
        badge: "bg-income-soft text-income",
      };
    }
    return match;
  }
  return {
    Icon: isIncome ? PaymentsIcon : WalletIcon,
    wrap: isIncome
      ? "bg-income-soft text-income"
      : "bg-primary-soft text-primary-main",
    badge: isIncome
      ? "bg-income-soft text-income"
      : "bg-primary-soft text-primary-dark",
  };
}

/** Resolve a Stitch icon for a category label (picker / budget rows). */
export function getCategoryIcon(category: string): IconComponent {
  const name = String(category || "").trim();
  if (!name) return WalletIcon;
  const match = ICON_TILES.find((tile) => tile.match.test(name));
  return match?.Icon ?? WalletIcon;
}

export type TransactionListRowVariant = "list" | "recent";

export interface TransactionListRowProps {
  transaction: Transaction;
  formatCurrency: (n: number) => string;
  onClick?: () => void;
  /** `list` = transactions feed (circular tile + category chip); `recent` = dashboard row (rounded tile + date + type/category chips). */
  variant?: TransactionListRowVariant;
  className?: string;
}

export function TransactionListRow({
  transaction,
  formatCurrency,
  onClick,
  variant = "list",
  className,
}: TransactionListRowProps) {
  const { formatDate } = useDateFormatter();
  const isIncome = transaction.type === "income";
  const title =
    transaction.title || transaction.description || UI_TEXT.NO_DESCRIPTION;
  const { Icon, wrap, badge } = resolveTransactionIconTile(transaction);
  const dateLabel = formatDate(transaction.date, "monthDay");
  const isRecent = variant === "recent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 text-left transition-colors",
        isRecent
          ? "gap-3 px-2 py-3.5 hover:bg-surface-low/50 md:gap-4 md:px-3"
          : "gap-3 py-3 hover:bg-surface-low/60",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          isRecent ? "h-11 w-11 rounded-xl" : "h-10 w-10 rounded-full",
          wrap,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-deep">{title}</p>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
          {isRecent ? (
            <Badge
              tone={isIncome ? "success" : "danger"}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            >
              {isIncome ? UI_TEXT.INCOME : UI_TEXT.EXPENSE}
            </Badge>
          ) : null}
          {transaction.category ? (
            <span
              className={cn(
                "inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                badge,
              )}
            >
              {transaction.category}
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            isIncome ? "text-income" : "text-expense",
          )}
        >
          {isIncome ? UI_TEXT.INCOME_SYMBOL : UI_TEXT.EXPENSE_SYMBOL}
          {CURRENCY_SYMBOL}
          {formatCurrency(transaction.amount)}
        </p>
        {isRecent && dateLabel ? (
          <p className="mt-0.5 text-[11px] text-on-surface-variant">{dateLabel}</p>
        ) : null}
      </div>
    </button>
  );
}
