"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  UI_MOTION,
  UI_TEXT,
  VIEW_PERIODS,
  VIEW_TYPE_SHORT_LABELS,
  VIEW_TYPES,
} from "@constants";

import { APP_ROUTES } from "@constants/routes";

import { Button, EmptyState, PeriodShiftPill, SegmentedPill, Spinner, StatCard } from "@common";

import { AddIcon, CloseIcon, CloudUploadIcon, ReceiptLongIcon, SearchIcon, TrendingUpIcon } from "@components/icons";
import { AddTransactionSheet, FilterPills, SpendSummaryBar, TransactionGroup } from "@components/mobile";
import { PeriodPicker } from "@components/shell/PeriodPicker";

import { periodNeedsCalendarMonthNav, useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useUiPeriod } from "@hooks/useUiPeriod";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { loadOlderTransactions } from "@store/slices/transactionsSlice";
import { setSearchQuery, setSelectedCategory, setTypeFilter, setViewType } from "@store/slices/uiSlice";
import { getCategoryChartColor } from "@utils/colorUtils";
import { compareByDateThenCreatedAt } from "@utils/dateUtils";
import { hapticTap } from "@utils/feedback";
import { filterByTransactionType } from "@utils/transactionFilters";

import type { Transaction, TransactionFilter, ViewType } from "@/types";

import { TransactionCalendar } from "./TransactionCalendar";
import { TransactionModal } from "./TransactionModal";

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
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const transactions = useAppSelector((state) => state.transactions.items);
  const txStatus = useAppSelector((state) => state.transactions.status);
  const hasMoreTransactions = useAppSelector((state) => state.transactions.hasMore);
  const loadingOlder = useAppSelector((state) => state.transactions.loadingOlder);
  const { viewType, searchQuery, selectedCategory, typeFilter } = useAppSelector((state) => state.ui);
  const {
    viewPeriod,
    selectedMonth,
    selectedYear,
    rangeStart,
    rangeEnd,
    shiftPeriod,
    canShiftPeriod,
    periodLabel,
    shiftPrevLabel,
    shiftNextLabel,
  } = useUiPeriod();
  const { formatCurrency } = useCurrencyFormatter();

  const [searchOpen, setSearchOpen] = useState(Boolean(searchQuery));
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(selectedMonth);
  const [calendarYear, setCalendarYear] = useState(selectedYear);

  const needsOwnCalendarNav = periodNeedsCalendarMonthNav(viewPeriod);

  useEffect(() => {
    setSearchInput(searchQuery);
    if (searchQuery) setSearchOpen(true);
  }, [searchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput !== searchQuery) {
        startTransition(() => {
          dispatch(setSearchQuery(searchInput));
        });
      }
    }, UI_MOTION.SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput, searchQuery, dispatch]);

  useEffect(() => {
    if (!needsOwnCalendarNav) {
      setCalendarMonth(selectedMonth);
      setCalendarYear(selectedYear);
      return;
    }
    // Seed calendar month once when entering multi-month periods.
    setCalendarMonth(selectedMonth);
    setCalendarYear(selectedYear);
  }, [needsOwnCalendarNav, selectedMonth, selectedYear, viewPeriod]);

  const { filteredTransactions, totalExpense, totalIncome } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
    searchQuery,
    rangeStart,
    rangeEnd,
  );

  const isGlobalSearch = Boolean(searchQuery.trim());

  const rows = useMemo(() => {
    const typed = filterByTransactionType(filteredTransactions, typeFilter);
    const categoryKey = String(selectedCategory || "")
      .trim()
      .toLowerCase();
    const byCategory = categoryKey
      ? typed.filter(
          (t) =>
            String(t.category || "")
              .trim()
              .toLowerCase() === categoryKey,
        )
      : typed;
    return [...byCategory].sort((a, b) => -compareByDateThenCreatedAt(a, b));
  }, [filteredTransactions, typeFilter, selectedCategory]);

  const groups = useMemo(() => groupByDate(rows), [rows]);

  /** Categories from the active type tab: All = every txn category; Income/Expense/Transfer = that pool only. */
  const spendSegments = useMemo(() => {
    const pool = filterByTransactionType(filteredTransactions, typeFilter);

    const totals = new Map<string, number>();
    for (const t of pool) {
      const name = String(t.category || "").trim() || EXPENSE_CATEGORIES.OTHER;
      totals.set(name, (totals.get(name) || 0) + (Number(t.amount) || 0));
    }

    return [...totals.entries()]
      .map(([name, value], i) => ({
        name,
        value,
        color: getCategoryChartColor(name, i),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, typeFilter]);

  const spendBarTitle = useMemo(() => {
    if (typeFilter === "income") return UI_TEXT.INCOME_BY_CATEGORY;
    if (typeFilter === "expense") return UI_TEXT.SPENDING_BY_CATEGORY;
    if (typeFilter === "transfer") return UI_TEXT.CATEGORY_BREAKDOWN;
    return UI_TEXT.CATEGORY_BREAKDOWN;
  }, [typeFilter]);

  const spendBarTotal = useMemo(() => {
    if (!selectedCategory) {
      return spendSegments.reduce((sum, s) => sum + s.value, 0);
    }
    const match = spendSegments.find((s) => s.name.toLowerCase() === selectedCategory.toLowerCase());
    return match?.value ?? 0;
  }, [selectedCategory, spendSegments]);

  const handleSelectCategory = useCallback(
    (category: string | null) => {
      dispatch(setSelectedCategory(category ?? ""));
      hapticTap();
    },
    [dispatch],
  );

  const handleTypeFilter = useCallback(
    (value: TransactionFilter) => {
      dispatch(setTypeFilter(value));
      dispatch(setSelectedCategory(""));
      hapticTap();
    },
    [dispatch],
  );

  const handleViewType = useCallback(
    (value: ViewType) => {
      dispatch(setViewType(value));
      hapticTap();
    },
    [dispatch],
  );

  const clearAllFilters = useCallback(() => {
    dispatch(setTypeFilter("all"));
    dispatch(setSelectedCategory(""));
    dispatch(setSearchQuery(""));
    setSearchInput("");
  }, [dispatch]);

  const handleLoadOlder = useCallback(() => {
    if (!userId || loadingOlder) return;
    void dispatch(loadOlderTransactions(userId));
  }, [dispatch, loadingOlder, userId]);

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setModalOpen(true);
  };

  const loading = txStatus === "loading" && transactions.length === 0;
  const calMonth = needsOwnCalendarNav ? calendarMonth : selectedMonth;
  const calYear = needsOwnCalendarNav ? calendarYear : selectedYear;

  const typeLabel =
    typeFilter === "all"
      ? null
      : typeFilter === "income"
        ? UI_TEXT.INCOME
        : typeFilter === "expense"
          ? UI_TEXT.EXPENSE
          : UI_TEXT.TRANSFER;

  const hasActiveFilters = Boolean(typeLabel || selectedCategory || isGlobalSearch);

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-5xl md:space-y-6">
      {/* Desktop ledger header (Stitch light) */}
      <div className="hidden items-start justify-between gap-4 md:flex">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-deep lg:text-[2rem] lg:leading-10">
            {UI_TEXT.TRANSACTIONS} Ledger
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant md:text-base">{UI_TEXT.VIEW_AND_MANAGE_TRANSACTIONS}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={APP_ROUTES.transactionsImport}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant/60 bg-card px-4 text-sm font-medium text-brand-deep transition hover:bg-surface-low"
          >
            <CloudUploadIcon className="h-4 w-4" />
            {UI_TEXT.IMPORT_BANK_STATEMENT}
          </Link>
          <Button size="md" onClick={() => setSheetOpen(true)} leftIcon={<AddIcon className="h-4 w-4" />}>
            {UI_TEXT.ADD_TRANSACTION}
          </Button>
        </div>
      </div>

      {/* Row 1: Period + List/Calendar + search */}
      <header className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <PeriodPicker variant="chip" allowRange className="shrink-0" />
          {canShiftPeriod ? (
            <PeriodShiftPill
              label={periodLabel}
              canShift={canShiftPeriod}
              onPrev={() => shiftPeriod(-1)}
              onNext={() => shiftPeriod(1)}
              prevLabel={shiftPrevLabel}
              nextLabel={shiftNextLabel}
              className="min-w-0"
            />
          ) : viewPeriod === VIEW_PERIODS.RANGE || viewPeriod === VIEW_PERIODS.ALL ? (
            <span className="truncate rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-medium text-on-surface-variant">
              {periodLabel}
            </span>
          ) : null}
        </div>

        <SegmentedPill
          ariaLabel={UI_TEXT.VIEW_TYPE_LABEL}
          className="w-auto max-w-full shrink-0 sm:w-48"
          value={viewType}
          onChange={handleViewType}
          options={[
            { value: VIEW_TYPES.LIST as ViewType, label: VIEW_TYPE_SHORT_LABELS[VIEW_TYPES.LIST], tone: "brand" },
            {
              value: VIEW_TYPES.CALENDAR as ViewType,
              label: VIEW_TYPE_SHORT_LABELS[VIEW_TYPES.CALENDAR],
              tone: "brand",
            },
          ]}
        />

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-low text-brand-deep ring-1 ring-outline-variant/60 transition hover:bg-primary-soft hover:text-primary-main"
          aria-label={UI_TEXT.SEARCH_LABEL}
          aria-pressed={searchOpen}
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </header>

      {searchOpen && (
        <div className="space-y-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
            className="w-full rounded-2xl border border-outline-variant/60 bg-card px-4 py-2.5 text-sm shadow-sm focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
            autoFocus
          />
          {isGlobalSearch ? (
            <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-main">
              {UI_TEXT.SEARCHING_ALL_TRANSACTIONS}
            </span>
          ) : null}
        </div>
      )}

      {/* Row 2: Type pills */}
      <FilterPills
        ariaLabel={UI_TEXT.TRANSACTIONS}
        value={typeFilter}
        onChange={handleTypeFilter}
        options={[
          { value: "all", label: UI_TEXT.ALL, tone: "brand" },
          { value: "income", label: UI_TEXT.INCOME, tone: "income" },
          { value: "expense", label: UI_TEXT.EXPENSE, tone: "expense" },
          { value: "transfer", label: UI_TEXT.TRANSFER, tone: "brand" },
        ]}
      />

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={UI_TEXT.ACTIVE_FILTERS_LABEL}>
          {typeLabel ? (
            <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-brand-deep">
              {typeLabel}
            </span>
          ) : null}
          {selectedCategory ? (
            <button
              type="button"
              onClick={() => handleSelectCategory(null)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-main"
            >
              {selectedCategory}
              <CloseIcon className="h-3 w-3" aria-hidden />
              <span className="sr-only">{UI_TEXT.CLEAR_FILTER}</span>
            </button>
          ) : null}
          {isGlobalSearch ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                dispatch(setSearchQuery(""));
              }}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-main"
            >
              {UI_TEXT.SEARCH_LABEL}
              <CloseIcon className="h-3 w-3" aria-hidden />
              <span className="sr-only">{UI_TEXT.CLEAR_SEARCH}</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-semibold text-primary-main underline-offset-2 hover:underline"
          >
            {UI_TEXT.CLEAR_ALL_FILTERS}
          </button>
        </div>
      ) : null}

      <SpendSummaryBar
        total={spendBarTotal}
        segments={spendSegments}
        formatCurrency={formatCurrency}
        title={spendBarTitle}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        variant="plain"
      />

      {/* Mobile import CTA */}
      <div className="flex flex-wrap gap-2 md:hidden">
        <Link
          href={APP_ROUTES.transactionsImport}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-primary-soft bg-card px-3 text-sm font-medium text-brand-deep"
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
          hint={isGlobalSearch ? UI_TEXT.SEARCHING_ALL_TRANSACTIONS : UI_TEXT.THIS_PERIOD}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label={UI_TEXT.LOADING} />
        </div>
      ) : viewType === VIEW_TYPES.CALENDAR ? (
        <TransactionCalendar
          transactions={rows}
          month={calMonth}
          year={calYear}
          onSelect={openEdit}
          showMonthNav={needsOwnCalendarNav}
          onMonthChange={(m, y) => {
            setCalendarMonth(m);
            setCalendarYear(y);
          }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongIcon className="h-6 w-6" />}
          title={UI_TEXT.NO_TRANSACTIONS}
          description={UI_TEXT.VIEW_AND_MANAGE_TRANSACTIONS}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setSheetOpen(true)}>{UI_TEXT.ADD_TRANSACTION}</Button>
              <Link
                href={APP_ROUTES.transactionsImport}
                className="inline-flex h-11 items-center rounded-xl border border-outline-variant/60 bg-card px-4 text-sm font-medium text-brand-deep"
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
          {hasMoreTransactions && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingOlder || !userId}
                onClick={handleLoadOlder}
              >
                {loadingOlder ? UI_TEXT.LOADING_OLDER_TRANSACTIONS : UI_TEXT.LOAD_OLDER_TRANSACTIONS}
              </Button>
            </div>
          )}
        </div>
      )}

      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
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
