"use client";

import { useEffect, useRef, useState } from "react";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";

import {
  AutorenewIcon,
  CheckIcon,
  DeleteIcon,
  EditIcon,
  MoreVertIcon,
  ScheduleIcon,
  WarningIcon,
} from "@components/icons";

import { cn } from "@utils/cn";
import { flashSuccess, hapticTap } from "@utils/feedback";

import type { Bill } from "@/types";

import {
  billTitle,
  billVendor,
  formatDueRelative,
  isBillPaid,
  resolveBillIcon,
  resolveDisplayStatus,
  type BillDisplayStatus,
} from "./billHelpers";

export interface BillCardProps {
  bill: Bill;
  formatCurrency: (n: number) => string;
  variant?: "mobile" | "desktop";
  onPay?: (bill: Bill) => void;
  onEdit?: (bill: Bill) => void;
  onDelete?: (bill: Bill) => void;
  paying?: boolean;
  className?: string;
}

function StatusIcon({ status }: { status: BillDisplayStatus }) {
  const cls = "h-3 w-3";
  if (status === "overdue") return <WarningIcon className={cls} />;
  if (status === "auto_pay") return <AutorenewIcon className={cls} />;
  if (status === "paid") return <CheckIcon className={cn(cls, "motion-check-draw")} />;
  return <ScheduleIcon className={cls} />;
}

function statusBadgeClass(status: BillDisplayStatus): string {
  switch (status) {
    case "overdue":
      return "bg-rose-100 text-expense";
    case "auto_pay":
      return "bg-primary-soft text-primary-main";
    case "paid":
      return "bg-emerald-50 text-income";
    default:
      return "bg-sky-100 text-sky-800";
  }
}

function statusLabel(status: BillDisplayStatus): string {
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

function usePaidFlash(paid: boolean) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prevPaid = useRef(paid);

  useEffect(() => {
    if (!prevPaid.current && paid) {
      flashSuccess(cardRef.current);
      hapticTap();
    }
    prevPaid.current = paid;
  }, [paid]);

  return cardRef;
}

function BillActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!onEdit && !onDelete) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-deep"
        aria-label={UI_TEXT.MORE_OPTIONS}
        aria-expanded={open}
      >
        <MoreVertIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-outline-variant/60 bg-card shadow-elevated">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-deep hover:bg-surface-low"
            >
              <EditIcon className="h-4 w-4" />
              {UI_TEXT.EDIT}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-expense hover:bg-expense-soft"
            >
              <DeleteIcon className="h-4 w-4" />
              {UI_TEXT.DELETE}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MobileBillCard({
  bill,
  formatCurrency,
  onPay,
  onEdit,
  onDelete,
  paying,
  className,
}: BillCardProps) {
  const title = billTitle(bill);
  const vendor = billVendor(bill);
  const display = resolveDisplayStatus(bill);
  const paid = isBillPaid(bill);
  const overdue = display === "overdue";
  const { Icon, wrap } = resolveBillIcon(title, bill.category);
  const dueText = formatDueRelative(bill.dueDate);
  const showPay = !paid;
  const cardRef = usePaidFlash(paid);

  return (
    <div className={cn("flex gap-3", className)}>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
          wrap,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div
        ref={cardRef}
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-4 shadow-card backdrop-blur-sm",
          overdue && "pl-5",
        )}
      >
        {overdue && (
          <span
            className="absolute bottom-0 left-0 top-0 w-1 bg-expense"
            aria-hidden
          />
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-brand-deep">
              {title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-gray-500">{vendor}</p>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <p className="text-lg font-bold tabular-nums text-brand-deep">
              {CURRENCY_SYMBOL}
              {formatCurrency(bill.amount)}
            </p>
            <BillActionsMenu
              onEdit={onEdit ? () => onEdit(bill) : undefined}
              onDelete={onDelete ? () => onDelete(bill) : undefined}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-widest",
              statusBadgeClass(display),
            )}
          >
            <StatusIcon status={display} />
            {statusLabel(display)}
          </span>
          <span className="text-xs font-medium text-gray-500">{dueText}</span>
        </div>

        {showPay && (
          <div className="mt-4 border-t border-surface-high/60 pt-4">
            <button
              type="button"
              disabled={paying}
              onClick={() => onPay?.(bill)}
              className="w-full rounded-xl bg-primary-main px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60"
            >
              {paying ? UI_TEXT.LOADING : UI_TEXT.PAY_NOW}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopBillCard({
  bill,
  formatCurrency,
  onPay,
  onEdit,
  onDelete,
  paying,
  className,
}: BillCardProps) {
  const title = billTitle(bill);
  const vendor = billVendor(bill);
  const display = resolveDisplayStatus(bill);
  const paid = isBillPaid(bill);
  const overdue = display === "overdue";
  const { Icon, wrap } = resolveBillIcon(title, bill.category);
  const dueText = formatDueRelative(bill.dueDate);
  const showPay = !paid;
  const cardRef = usePaidFlash(paid);

  return (
    <div
      ref={cardRef}
      className={cn(
        "flex flex-col justify-between rounded-xl border border-white/60 bg-white/90 p-4 shadow-card",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              wrap,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-brand-deep">
              {title}
            </p>
            <p className="truncate text-xs text-gray-500">{vendor}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <span className="text-sm font-bold tabular-nums text-brand-deep">
            {CURRENCY_SYMBOL}
            {formatCurrency(bill.amount)}
          </span>
          <BillActionsMenu
            onEdit={onEdit ? () => onEdit(bill) : undefined}
            onDelete={onDelete ? () => onDelete(bill) : undefined}
          />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex max-w-full items-center gap-1 truncate rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide",
            overdue
              ? "bg-rose-100 text-expense"
              : paid
                ? "bg-emerald-50 text-income"
                : "bg-surface-high text-gray-600",
          )}
        >
          {overdue && <WarningIcon className="h-3.5 w-3.5 shrink-0" />}
          {paid && <CheckIcon className="motion-check-draw h-3.5 w-3.5 shrink-0" />}
          {statusLabel(display)}
          {" — "}
          {dueText}
        </span>
        {showPay && (
          <button
            type="button"
            disabled={paying}
            onClick={() => onPay?.(bill)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-main transition-colors hover:bg-primary-main/5 disabled:opacity-60"
          >
            {paying ? UI_TEXT.LOADING : UI_TEXT.PAY_NOW}
          </button>
        )}
      </div>
    </div>
  );
}

export function BillCard(props: BillCardProps) {
  if (props.variant === "desktop") {
    return <DesktopBillCard {...props} />;
  }
  return <MobileBillCard {...props} />;
}
