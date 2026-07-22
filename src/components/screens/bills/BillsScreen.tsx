"use client";

import { CURRENCY_SYMBOL, DATE_CONSTANTS, UI_TEXT } from "@constants";
import { Button, ConfirmDialog, EmptyState } from "@common";
import {
  AddIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  CalendarMonthIcon,
  EventRepeatIcon,
  SearchIcon,
} from "@components/icons";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { deleteBill, markBillPaid } from "@store/slices/billsSlice";
import { deleteRecurring } from "@store/slices/recurringSlice";
import { showError, showSuccess } from "@utils/toast";
import type { Bill, RecurringTransaction } from "@/types";
import { useMemo, useState } from "react";
import { BillCard } from "./BillCard";
import { BillModal } from "./BillModal";
import {
  billsDueWithinDays,
  filterBillsByTab,
  isBillPaid,
  matchesBillSearch,
  resolveBillStatus,
  sortBillsByDue,
  sumAmounts,
  unpaidBillsInMonth,
  type BillTab,
} from "./billHelpers";
import { BillsSummaryBar } from "./BillsSummaryBar";
import { BillsTabs } from "./BillsTabs";
import { BillsTimeline } from "./BillsTimeline";
import { PaymentsCalendar } from "./PaymentsCalendar";
import { RecurringModal } from "./RecurringModal";

export function BillsScreen() {
  const dispatch = useAppDispatch();
  const navigateToTab = useAppNavigation();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const bills = useAppSelector((s) => s.bills.items);
  const recurring = useAppSelector((s) => s.recurring.items);
  const { selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const { formatCurrency } = useCurrencyFormatter();

  const [tab, setTab] = useState<BillTab>("upcoming");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringTransaction | null>(null);
  const [pendingDeleteBill, setPendingDeleteBill] = useState<Bill | null>(null);
  const [pendingDeleteRecurring, setPendingDeleteRecurring] =
    useState<RecurringTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [bulkPaying, setBulkPaying] = useState(false);

  const overdueCount = useMemo(
    () =>
      bills.filter(
        (b) => !isBillPaid(b) && resolveBillStatus(b) === "overdue",
      ).length,
    [bills],
  );

  const filteredBills = useMemo(() => {
    const byTab = filterBillsByTab(bills, tab);
    const searched = byTab.filter((b) => matchesBillSearch(b, searchQuery));
    return sortBillsByDue(searched);
  }, [bills, tab, searchQuery]);

  const dueSoon = useMemo(
    () =>
      billsDueWithinDays(bills, DATE_CONSTANTS.BILLS_DUE_WINDOW_DAYS),
    [bills],
  );
  const dueSoonTotal = useMemo(() => sumAmounts(dueSoon), [dueSoon]);

  const monthUnpaid = useMemo(
    () => unpaidBillsInMonth(bills, selectedMonth, selectedYear),
    [bills, selectedMonth, selectedYear],
  );
  const monthDueTotal = useMemo(() => sumAmounts(monthUnpaid), [monthUnpaid]);

  const markPaid = async (bill: Bill) => {
    if (!userId || isBillPaid(bill)) return;
    setPayingId(bill.id);
    try {
      await dispatch(markBillPaid({ id: bill.id, userId })).unwrap();
      showSuccess(UI_TEXT.SUCCESS_BILL_MARKED_PAID);
    } catch {
      showError(UI_TEXT.TRY_AGAIN);
    } finally {
      setPayingId(null);
    }
  };

  const markManyPaid = async (targets: Bill[]) => {
    if (!userId) return;
    const unpaid = targets.filter((b) => !isBillPaid(b));
    if (unpaid.length === 0) {
      showError(UI_TEXT.NO_UNPAID_BILLS);
      return;
    }
    setBulkPaying(true);
    try {
      for (const bill of unpaid) {
        await dispatch(markBillPaid({ id: bill.id, userId })).unwrap();
      }
      showSuccess(
        UI_TEXT.SUCCESS_BILLS_MARKED_PAID.replace(
          "{n}",
          String(unpaid.length),
        ),
      );
    } catch {
      showError(UI_TEXT.TRY_AGAIN);
    } finally {
      setBulkPaying(false);
    }
  };

  const openAddBill = () => {
    setEditingBill(null);
    setBillModalOpen(true);
  };

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setBillModalOpen(true);
  };

  return (
    <div className="relative mx-auto max-w-6xl pb-36 md:pb-0">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 -mx-margin-mobile mb-0 flex items-center justify-between gap-3 border-b border-surface-high bg-surface/90 px-margin-mobile py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => navigateToTab("overview")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container transition-transform active:scale-95"
          aria-label={UI_TEXT.CLOSE}
        >
          <ArrowBackIcon className="h-5 w-5 text-brand-deep" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-brand-deep">
          {UI_TEXT.BILLS_AND_RECURRING}
        </h1>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
          aria-label={UI_TEXT.SEARCH_LABEL}
        >
          <SearchIcon className="h-5 w-5 text-gray-500" />
        </button>
      </header>

      {/* Desktop header */}
      <div className="mb-5 hidden items-end justify-between gap-3 md:flex">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-brand-deep">
            {UI_TEXT.BILLS_AND_RECURRING}
          </h2>
          <p className="text-sm text-gray-500">{UI_TEXT.PAYMENTS_CALENDAR}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CalendarMonthIcon className="h-4 w-4" />}
            onClick={() => setCalendarOpen((v) => !v)}
          >
            {calendarOpen ? UI_TEXT.HIDE_CALENDAR : UI_TEXT.SHOW_CALENDAR}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<EventRepeatIcon className="h-4 w-4" />}
            onClick={() => {
              setEditingRecurring(null);
              setRecurringModalOpen(true);
            }}
          >
            {UI_TEXT.ADD_RECURRING_TRANSACTION_TITLE}
          </Button>
          <Button
            size="sm"
            leftIcon={<AddIcon className="h-4 w-4" />}
            onClick={openAddBill}
          >
            {UI_TEXT.ADD_BILL_REMINDER_TITLE}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="mb-3 md:hidden">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI_TEXT.SEARCH_BILLS}
            className="w-full rounded-xl border border-surface-high bg-white px-4 py-2.5 text-sm text-brand-deep outline-none ring-primary-main/30 placeholder:text-gray-400 focus:ring-2"
            autoFocus
          />
        </div>
      )}

      {/* Desktop search */}
      <div className="mb-4 hidden md:block">
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI_TEXT.SEARCH_BILLS}
            className="w-full rounded-xl border border-surface-high bg-white py-2.5 pl-10 pr-4 text-sm text-brand-deep outline-none ring-primary-main/30 placeholder:text-gray-400 focus:ring-2"
          />
        </div>
      </div>

      {/* Desktop total due summary */}
      <div className="mb-5 hidden items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/90 p-5 shadow-card md:flex">
        <div>
          <h3 className="text-base font-medium text-gray-500">
            {UI_TEXT.TOTAL_DUE_THIS_MONTH}
          </h3>
          <p className="mt-1 text-3xl font-bold tracking-tight text-primary-main md:text-4xl">
            {CURRENCY_SYMBOL}
            {formatCurrency(monthDueTotal)}
          </p>
        </div>
        <button
          type="button"
          disabled={bulkPaying || monthUnpaid.length === 0}
          onClick={() => markManyPaid(monthUnpaid)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-main px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bulkPaying ? UI_TEXT.LOADING : UI_TEXT.PAY_ALL}
          <ArrowForwardIcon className="h-4 w-4" />
        </button>
      </div>

      {calendarOpen && (
        <div className="mb-5 hidden md:block">
          <PaymentsCalendar
            bills={bills}
            month={selectedMonth}
            year={selectedYear}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BillsTabs
            value={tab}
            onChange={setTab}
            upcomingHasAlert={overdueCount > 0}
            className="-mx-margin-mobile px-0 md:mx-0 md:mb-4 md:rounded-none"
          />

          {/* Mobile quick actions */}
          <div className="mt-4 flex gap-2 md:hidden">
            <Button
              size="sm"
              fullWidth
              leftIcon={<AddIcon className="h-4 w-4" />}
              onClick={openAddBill}
            >
              {UI_TEXT.ADD_BILL_REMINDER_TITLE}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              leftIcon={<CalendarMonthIcon className="h-4 w-4" />}
              onClick={() => setCalendarOpen((v) => !v)}
              aria-label={
                calendarOpen ? UI_TEXT.HIDE_CALENDAR : UI_TEXT.SHOW_CALENDAR
              }
            />
          </div>

          {calendarOpen && (
            <div className="mt-4 md:hidden">
              <PaymentsCalendar
                bills={bills}
                month={selectedMonth}
                year={selectedYear}
              />
            </div>
          )}

          {filteredBills.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={
                  bills.length === 0
                    ? UI_TEXT.NO_BILL_REMINDERS
                    : UI_TEXT.NO_BILLS_MATCH
                }
                action={
                  <Button onClick={openAddBill}>
                    {UI_TEXT.ADD_BILL_REMINDER_TITLE}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Mobile stacked cards */}
              <ul className="mt-5 flex flex-col gap-5 md:hidden">
                {filteredBills.map((bill) => (
                  <li key={bill.id}>
                    <BillCard
                      bill={bill}
                      variant="mobile"
                      formatCurrency={formatCurrency}
                      onPay={markPaid}
                      onEdit={openEditBill}
                      onDelete={setPendingDeleteBill}
                      paying={payingId === bill.id}
                    />
                  </li>
                ))}
              </ul>

              {/* Desktop 2-column grid */}
              <div className="mt-2 hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
                {filteredBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    variant="desktop"
                    formatCurrency={formatCurrency}
                    onPay={markPaid}
                    onEdit={openEditBill}
                    onDelete={setPendingDeleteBill}
                    paying={payingId === bill.id}
                  />
                ))}
              </div>
            </>
          )}

          {/* Recurring section */}
          <section className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-brand-deep">
                <EventRepeatIcon className="h-4 w-4 text-primary-main" />
                {UI_TEXT.RECURRING}
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-gray-500">
                  {recurring.length}
                </span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<AddIcon className="h-4 w-4" />}
                onClick={() => {
                  setEditingRecurring(null);
                  setRecurringModalOpen(true);
                }}
              >
                {UI_TEXT.ADD_RECURRING}
              </Button>
            </div>

            {recurring.length === 0 ? (
              <EmptyState title={UI_TEXT.NO_RECURRING_TRANSACTIONS} />
            ) : (
              <ul className="divide-y divide-gray-50 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-card">
                {recurring.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-deep">
                        {r.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.category} · {r.recurrence}
                      </p>
                    </div>
                    <span
                      className={
                        "text-sm font-semibold " +
                        (r.type === "income" ? "text-income" : "text-expense")
                      }
                    >
                      {CURRENCY_SYMBOL}
                      {formatCurrency(r.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-primary-main hover:bg-primary-soft"
                        onClick={() => {
                          setEditingRecurring(r);
                          setRecurringModalOpen(true);
                        }}
                      >
                        {UI_TEXT.EDIT}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-medium text-expense hover:bg-rose-50"
                        onClick={() => setPendingDeleteRecurring(r)}
                      >
                        {UI_TEXT.DELETE}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-4">
          <BillsTimeline
            bills={filterBillsByTab(bills, "upcoming")}
            formatCurrency={formatCurrency}
            onSelect={openEditBill}
          />
        </div>
      </div>

      <BillsSummaryBar
        total={dueSoonTotal}
        formatCurrency={formatCurrency}
        onPaySelected={() => markManyPaid(dueSoon)}
        paying={bulkPaying}
        disabled={dueSoon.length === 0}
      />

      <BillModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        bill={editingBill}
      />
      <RecurringModal
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        recurring={editingRecurring}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteBill)}
        title={UI_TEXT.DELETE_BILL_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_BILL}
        confirmLabel={UI_TEXT.DELETE}
        loading={busy}
        onCancel={() => setPendingDeleteBill(null)}
        onConfirm={async () => {
          if (!pendingDeleteBill) return;
          setBusy(true);
          try {
            await dispatch(deleteBill(pendingDeleteBill.id)).unwrap();
            showSuccess(UI_TEXT.SUCCESS_BILL_DELETED);
            setPendingDeleteBill(null);
          } finally {
            setBusy(false);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteRecurring)}
        title={UI_TEXT.DELETE_RECURRING_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_RECURRING}
        confirmLabel={UI_TEXT.DELETE}
        loading={busy}
        onCancel={() => setPendingDeleteRecurring(null)}
        onConfirm={async () => {
          if (!pendingDeleteRecurring) return;
          setBusy(true);
          try {
            await dispatch(deleteRecurring(pendingDeleteRecurring.id)).unwrap();
            showSuccess(UI_TEXT.SUCCESS_RECURRING_DELETED);
            setPendingDeleteRecurring(null);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
