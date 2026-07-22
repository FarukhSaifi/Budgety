"use client";

import {
  CURRENCY_SYMBOL,
  DEFAULT_CATEGORY_TAG_COLOR,
  MONTHS,
  PERCENTAGE_THRESHOLDS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { Badge, ConfirmDialog, ProgressBar } from "@common";
import {
  AccountBalanceWalletIcon,
  AddIcon,
  ApartmentIcon,
  CommuteIcon,
  DeleteIcon,
  DirectionsCarIcon,
  EditIcon,
  FitnessCenterIcon,
  HealthAndSafetyIcon,
  LocalCafeIcon,
  MoreVertIcon,
  MovieIcon,
  RestaurantIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SubscriptionsIcon,
  WifiIcon,
  WorkIcon,
} from "@components/icons";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { deleteBudget } from "@store/slices/budgetsSlice";
import { cn } from "@utils/cn";
import { getCategoryChartColor } from "@utils/colorUtils";
import { showSuccess } from "@utils/toast";
import type { Budget } from "@/types";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BudgetModal } from "./BudgetModal";

type BudgetStatus = "good" | "near" | "over";

function categoryColor(category: string, index = 0): string {
  return getCategoryChartColor(category, index) || DEFAULT_CATEGORY_TAG_COLOR;
}

function money(symbol: string, formatCurrency: (n: number) => string, amount: number): string {
  return `${symbol}${formatCurrency(amount)}`;
}

function statusForPercent(percent: number): BudgetStatus {
  if (percent >= PERCENTAGE_THRESHOLDS.MAX) return "over";
  if (percent >= PERCENTAGE_THRESHOLDS.WARNING) return "near";
  return "good";
}

function statusMeta(status: BudgetStatus): {
  label: string;
  tone: "success" | "warning" | "danger";
  usedClass: string;
  remainingClass: string;
} {
  switch (status) {
    case "over":
      return {
        label: UI_TEXT.BUDGET_STATUS_OVER,
        tone: "danger",
        usedClass: "text-expense",
        remainingClass: "text-expense",
      };
    case "near":
      return {
        label: UI_TEXT.BUDGET_STATUS_NEAR_LIMIT,
        tone: "warning",
        usedClass: "text-amber-600",
        remainingClass: "text-amber-600",
      };
    default:
      return {
        label: UI_TEXT.BUDGET_STATUS_GOOD,
        tone: "success",
        usedClass: "text-income",
        remainingClass: "text-income",
      };
  }
}

function categoryIcon(category: string): ReactNode {
  const key = category.toLowerCase();
  const cls = "h-5 w-5";
  if (key.includes("groc") || key.includes("shop")) return <ShoppingCartIcon className={cls} />;
  if (key.includes("dining") || key.includes("restaurant") || key.includes("food")) {
    return <RestaurantIcon className={cls} />;
  }
  if (key.includes("cafe") || key.includes("coffee")) return <LocalCafeIcon className={cls} />;
  if (key.includes("rent") || key.includes("hous") || key.includes("util") || key.includes("apart")) {
    return <ApartmentIcon className={cls} />;
  }
  if (key.includes("entertain") || key.includes("movie")) return <MovieIcon className={cls} />;
  if (key.includes("transport") || key.includes("commute")) return <CommuteIcon className={cls} />;
  if (key.includes("car") || key.includes("fuel")) return <DirectionsCarIcon className={cls} />;
  if (key.includes("health") || key.includes("medical") || key.includes("insur")) {
    return <HealthAndSafetyIcon className={cls} />;
  }
  if (key.includes("fitness") || key.includes("gym")) return <FitnessCenterIcon className={cls} />;
  if (key.includes("subscri") || key.includes("wifi") || key.includes("internet")) {
    return key.includes("wifi") || key.includes("internet") ? (
      <WifiIcon className={cls} />
    ) : (
      <SubscriptionsIcon className={cls} />
    );
  }
  if (key.includes("work") || key.includes("office")) return <WorkIcon className={cls} />;
  if (key.includes("bag") || key.includes("mall")) return <ShoppingBagIcon className={cls} />;
  return <AccountBalanceWalletIcon className={cls} />;
}

function BudgetCardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        aria-label="More options"
        aria-expanded={open}
      >
        <MoreVertIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-elevated">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            <EditIcon className="h-4 w-4" />
            {UI_TEXT.EDIT}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-expense hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <DeleteIcon className="h-4 w-4" />
            {UI_TEXT.DELETE}
          </button>
        </div>
      )}
    </div>
  );
}

export function BudgetsScreen() {
  const dispatch = useAppDispatch();
  const budgets = useAppSelector((state) => state.budgets.items);
  const transactions = useAppSelector((state) => state.transactions.items);
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((state) => state.ui);
  const { formatCurrency } = useCurrencyFormatter();

  const { spendingByCategory } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (b: Budget) => {
    setEditing(b);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteBudget(pendingDelete.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_BUDGET_DELETED);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const visibleBudgets = useMemo(() => {
    return budgets.filter((b) => {
      if (b.year != null && b.year !== selectedYear) return false;
      if (viewPeriod === VIEW_PERIODS.MONTHLY && b.period === "monthly" && b.month != null) {
        return b.month === selectedMonth;
      }
      return true;
    });
  }, [budgets, selectedMonth, selectedYear, viewPeriod]);

  const { totalSpent, totalLimit, usedPct, summaryStatus } = useMemo(() => {
    const spent = visibleBudgets.reduce(
      (sum, b) => sum + (spendingByCategory[b.category] ?? 0),
      0,
    );
    const limit = visibleBudgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      totalSpent: spent,
      totalLimit: limit,
      usedPct: pct,
      summaryStatus: statusForPercent(pct),
    };
  }, [visibleBudgets, spendingByCategory]);

  const summaryMeta = statusMeta(summaryStatus);
  const periodChip =
    viewPeriod === VIEW_PERIODS.YEARLY
      ? String(selectedYear)
      : `${MONTHS[selectedMonth - 1]?.slice(0, 3) ?? ""} ${selectedYear}`;
  const heading =
    viewPeriod === VIEW_PERIODS.YEARLY ? UI_TEXT.YEARLY_BUDGETS : UI_TEXT.MONTHLY_BUDGETS;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-brand-deep">{heading}</h1>
        <p className="mt-1 text-sm text-gray-500">{UI_TEXT.BUDGETS_SUBTITLE}</p>
      </header>

      {visibleBudgets.length > 0 && (
        <section className="rounded-card border border-primary-soft/40 bg-white p-5 shadow-card">
          <div className="mb-1 flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {UI_TEXT.TOTAL_SPENT}
            </p>
            <span className="rounded-full bg-surface-low px-2.5 py-1 text-xs font-medium text-brand-deep">
              {periodChip}
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-brand-deep">
            {money(CURRENCY_SYMBOL, formatCurrency, totalSpent)}
          </p>
          <ProgressBar value={usedPct} className="mt-4 h-2.5" />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {UI_TEXT.LIMIT_LABEL}: {money(CURRENCY_SYMBOL, formatCurrency, totalLimit)}
            </span>
            <span className={cn("font-semibold", summaryMeta.usedClass)}>
              {Math.round(usedPct)}% {UI_TEXT.USED_LABEL}
            </span>
          </div>
        </section>
      )}

      <section className="space-y-3">
        {visibleBudgets.length === 0 ? (
          <div className="rounded-card border border-dashed border-gray-200 bg-white/80 px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-main">
              <AccountBalanceWalletIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">{UI_TEXT.NO_BUDGETS}</p>
          </div>
        ) : (
          visibleBudgets.map((b, index) => {
            const spent = spendingByCategory[b.category] ?? 0;
            const limit = b.limitAmount || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit - spent;
            const status = statusForPercent(percent);
            const meta = statusMeta(status);
            const over = status === "over";
            const color = categoryColor(b.category, index);

            return (
              <article
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(b)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(b);
                  }
                }}
                className="cursor-pointer rounded-card border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main/30"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: color }}
                    >
                      {categoryIcon(b.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-deep">{b.category}</p>
                      <p className="text-xs capitalize text-gray-400">{b.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <BudgetCardMenu
                      onEdit={() => openEdit(b)}
                      onDelete={() => setPendingDelete(b)}
                    />
                  </div>
                </div>

                <div className="mb-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {UI_TEXT.SPENT}
                    </p>
                    <p className="text-lg font-bold text-brand-deep">
                      {money(CURRENCY_SYMBOL, formatCurrency, spent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {over ? UI_TEXT.OVER_BUDGET : UI_TEXT.REMAINING}
                    </p>
                    <p className={cn("text-sm font-semibold", meta.remainingClass)}>
                      {over ? "-" : ""}
                      {money(CURRENCY_SYMBOL, formatCurrency, Math.abs(remaining))}
                    </p>
                  </div>
                </div>

                <ProgressBar value={percent} className="h-2" fillColor={color} />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>{money(CURRENCY_SYMBOL, formatCurrency, 0)}</span>
                  <span>{money(CURRENCY_SYMBOL, formatCurrency, limit)}</span>
                </div>
              </article>
            );
          })
        )}

        <button
          type="button"
          onClick={openAdd}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary-soft bg-surface/60 px-4 py-8 text-primary-main transition-colors hover:border-primary-main/40 hover:bg-primary-soft/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-soft bg-white shadow-card">
            <AddIcon className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">{UI_TEXT.ADD_CATEGORY_BUDGET}</span>
        </button>
      </section>

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} budget={editing} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={UI_TEXT.DELETE_BUDGET_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_BUDGET}
        confirmLabel={UI_TEXT.DELETE}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
