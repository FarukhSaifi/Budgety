"use client";

import {
  CATEGORY_COLORS,
  CURRENCY_SYMBOL,
  DEFAULT_CATEGORY_TAG_COLOR,
  STITCH_CHART_COLORS,
  UI_TEXT,
  VIEW_TYPE_LABELS,
  VIEW_TYPES,
} from "@constants";
import { APP_ROUTES } from "@constants/routes";
import { Button, EmptyState, Spinner, StatCard } from "@common";
import {
  FilterPills,
  SpendSummaryBar,
  TransactionGroup,
  AddTransactionSheet,
} from "@components/mobile";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  setSearchQuery,
  setViewType,
  setViewPeriod,
} from "@store/slices/uiSlice";
import { compareByDateThenCreatedAt } from "@utils/dateUtils";
import { filterByTransactionType } from "@utils/transactionFilters";
import type { Transaction, TransactionFilter, ViewType } from "@/types";
import {
  AddIcon,
  CalendarTodayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudUploadIcon,
  ListAltIcon,
  ReceiptLongIcon,
  SearchIcon,
  TrendingUpIcon,
} from "@components/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TransactionCalendar } from "./TransactionCalendar";
import { TransactionModal } from "./TransactionModal";

function categoryColor(category: string, index: number): string {
  return (
    (CATEGORY_COLORS as Record<string, string>)[category] ??
    STITCH_CHART_COLORS[index % STITCH_CHART_COLORS.length] ??
    DEFAULT_CATEGORY_TAG_COLOR
  );
}

function groupByDate(rows: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  rows.forEach((t) => {
    const key = (t.date || "").slice(0, 10) || "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  });
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

/** Stitch mobile group header: "21 Mon 12.2025" */
function formatGroupHeader(isoDay: string): { dayNumber: string; label: string } {
  const d = new Date(isoDay);
  if (Number.isNaN(d.getTime())) return { dayNumber: "", label: isoDay };
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return {
    dayNumber: String(d.getDate()).padStart(2, "0"),
    label: `${weekday} ${month}.${year}`,
  };
}

export function TransactionsScreen() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.transactions.items);
  const txStatus = useAppSelector((state) => state.transactions.status);
  const { viewPeriod, viewType, selectedMonth, selectedYear, searchQuery } =
    useAppSelector((state) => state.ui);
  const { formatCurrency } = useCurrencyFormatter();

  const [typeFilter, setTypeFilter] = useState<TransactionFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { filteredTransactions, totalExpense, totalIncome, spendingByCategory } =
    useBudgetCalculations(
      transactions,
      viewPeriod,
      selectedMonth,
      selectedYear,
      searchQuery,
    );

  const rows = useMemo(() => {
    const typed = filterByTransactionType(filteredTransactions, typeFilter);
    return [...typed].sort((a, b) => -compareByDateThenCreatedAt(a, b));
  }, [filteredTransactions, typeFilter]);

  const groups = useMemo(() => groupByDate(rows), [rows]);

  const spendSegments = useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([name, value], i) => ({
        name,
        value,
        color: categoryColor(name, i),
      }))
      .sort((a, b) => b.value - a.value);
  }, [spendingByCategory]);

  const dateNavLabel = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth - 1, 1);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedMonth, selectedYear]);

  const shiftMonth = (delta: number) => {
    const d = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    dispatch(
      setViewPeriod({
        viewPeriod: "monthly",
        selectedMonth: d.getMonth() + 1,
        selectedYear: d.getFullYear(),
      }),
    );
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setModalOpen(true);
  };

  const loading = txStatus === "loading" && transactions.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-5xl md:space-y-6">
      {/* Desktop ledger header (Stitch light) */}
      <div className="hidden items-start justify-between gap-4 md:flex">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-deep lg:text-[32px] lg:leading-10">
            {UI_TEXT.TRANSACTIONS} Ledger
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            {UI_TEXT.VIEW_AND_MANAGE_TRANSACTIONS}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={APP_ROUTES.transactionsImport}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-deep transition hover:bg-surface-low"
          >
            <CloudUploadIcon className="h-4 w-4" />
            {UI_TEXT.IMPORT_BANK_STATEMENT}
          </Link>
          <Button
            size="md"
            onClick={() => setSheetOpen(true)}
            leftIcon={<AddIcon className="h-4 w-4" />}
          >
            {UI_TEXT.ADD_TRANSACTION}
          </Button>
        </div>
      </div>

      {/* Mobile / shared period toolbar (Stitch recreated) */}
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            dispatch(
              setViewType(
                viewType === VIEW_TYPES.LIST
                  ? (VIEW_TYPES.CALENDAR as ViewType)
                  : (VIEW_TYPES.LIST as ViewType),
              ),
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-low text-brand-deep transition hover:bg-surface-container"
          aria-label={
            viewType === VIEW_TYPES.LIST
              ? VIEW_TYPE_LABELS[VIEW_TYPES.CALENDAR]
              : VIEW_TYPE_LABELS[VIEW_TYPES.LIST]
          }
        >
          {viewType === VIEW_TYPES.LIST ? (
            <CalendarTodayIcon className="h-5 w-5" />
          ) : (
            <ListAltIcon className="h-5 w-5" />
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-low hover:text-brand-deep"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="min-w-[140px] text-center text-sm font-bold text-brand-deep">
            {dateNavLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-low hover:text-brand-deep"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-low text-brand-deep transition hover:bg-surface-container"
          aria-label={UI_TEXT.SEARCH_LABEL}
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </header>

      {searchOpen && (
        <input
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
          autoFocus
        />
      )}

      <FilterPills
        variant="underline"
        value={typeFilter}
        onChange={setTypeFilter}
        options={[
          { value: "all", label: UI_TEXT.ALL },
          { value: "income", label: UI_TEXT.INCOME },
          { value: "expense", label: UI_TEXT.EXPENSE },
          { value: "transfer", label: UI_TEXT.TRANSFER },
        ]}
      />

      <SpendSummaryBar
        total={totalExpense}
        segments={spendSegments}
        formatCurrency={formatCurrency}
        className="border-0 bg-transparent p-0 shadow-none"
      />

      {/* Mobile import CTA */}
      <div className="flex flex-wrap gap-2 md:hidden">
        <Link
          href={APP_ROUTES.transactionsImport}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary-soft bg-white px-3 text-sm font-medium text-brand-deep"
        >
          <CloudUploadIcon className="h-4 w-4" />
          {UI_TEXT.IMPORT_BANK_STATEMENT}
        </Link>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          {UI_TEXT.ADD_TRANSACTION}
        </Button>
      </div>

      {/* Desktop summary strip */}
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <StatCard
          label={`${UI_TEXT.TOTAL_SPEND}`}
          value={`${CURRENCY_SYMBOL}${formatCurrency(totalExpense)}`}
          tone="expense"
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
        <StatCard
          label={UI_TEXT.TOTAL_INCOME_LABEL}
          value={`${CURRENCY_SYMBOL}${formatCurrency(totalIncome)}`}
          tone="income"
          icon={<TrendingUpIcon className="h-5 w-5" />}
        />
        <StatCard
          label={UI_TEXT.TRANSACTION_S}
          value={rows.length}
          tone="brand"
          icon={<ReceiptLongIcon className="h-5 w-5" />}
          hint={UI_TEXT.THIS_PERIOD}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label={UI_TEXT.LOADING} />
        </div>
      ) : viewType === VIEW_TYPES.CALENDAR ? (
        <TransactionCalendar
          transactions={rows}
          month={selectedMonth}
          year={selectedYear}
          onSelect={openEdit}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongIcon className="h-6 w-6" />}
          title={UI_TEXT.NO_TRANSACTIONS}
          description={UI_TEXT.VIEW_AND_MANAGE_TRANSACTIONS}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setSheetOpen(true)}>
                {UI_TEXT.ADD_TRANSACTION}
              </Button>
              <Link
                href={APP_ROUTES.transactionsImport}
                className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-deep"
              >
                {UI_TEXT.IMPORT_BANK_STATEMENT}
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-6 md:rounded-card md:bg-card md:p-5 md:shadow-card">
          {groups.map(([day, list]) => {
            const header = formatGroupHeader(day);
            return (
              <TransactionGroup
                key={day}
                dayNumber={header.dayNumber}
                dateLabel={header.label}
                transactions={list}
                formatCurrency={formatCurrency}
                onSelect={openEdit}
              />
            );
          })}
        </div>
      )}

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        transaction={editing}
      />
    </div>
  );
}
