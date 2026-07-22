"use client";

import type { PaymentMode, Transaction, TransactionType } from "@/types";
import { CategoryPicker } from "@common";
import { CalendarTodayIcon, KeyboardArrowDownIcon } from "@components/icons";
import { CURRENCY_SYMBOL, NUMBER_FORMAT, UI_TEXT } from "@constants";
import { PAYMENT_MODES_LIST } from "@constants/firestore";
import { toStorageDate } from "@hooks/useDateFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addTransaction, updateTransaction } from "@store/slices/transactionsSlice";
import { parseDate, todayStorage } from "@utils/dateUtils";
import { showError, showSuccess } from "@utils/toast";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AlertBanner } from "./AlertBanner";
import { NumericKeypad } from "./NumericKeypad";
import { SegmentedTabs } from "./SegmentedTabs";

type SheetType = "income" | "expense" | "transfer";

export interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  budgetPct?: number | null;
}

function formatDisplayDate(storageDate: string): string {
  const d = parseDate(storageDate);
  if (!d) return storageDate;
  return d.format("DD MMM YYYY");
}

export function AddTransactionSheet({ open, onClose, transaction, budgetPct }: AddTransactionSheetProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);

  const [sheetType, setSheetType] = useState<SheetType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayStorage);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(transaction);

  useResetOnOpen(open, transaction?.id, () => {
    setAlertDismissed(false);
    if (transaction) {
      setSheetType(transaction.type);
      setAmount(String(transaction.amount ?? ""));
      setDescription(transaction.title ?? transaction.description ?? "");
      setCategory(transaction.category ?? "");
      setDate(toStorageDate(transaction.date) || todayStorage());
      setPaymentMode(transaction.paymentMode ?? "Cash");
    } else {
      setSheetType("expense");
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(todayStorage());
      setPaymentMode("Cash");
    }
  });

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    // Native calendar must open from a real control — opacity-0 overlays get
    // clipped by overflow:hidden sheets and leave parts of the popup unusable.
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      // Some browsers throw if showPicker isn't allowed; fall through to click.
    }
    el.focus();
    el.click();
  };

  const txType: TransactionType = sheetType === "income" ? "income" : "expense";

  const displayAmount = useMemo(() => {
    const n = Number(amount);
    if (!amount || Number.isNaN(n)) return `${CURRENCY_SYMBOL}0.00`;
    return `${CURRENCY_SYMBOL}${n.toLocaleString("en-IN", {
      minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
      maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
    })}`;
  }, [amount]);

  const appendDigit = (digit: string) => {
    setAmount((prev) => {
      if (prev.includes(".") && prev.split(".")[1]?.length >= 2) return prev;
      if (prev === "0") return digit;
      return `${prev}${digit}`;
    });
  };

  const appendDecimal = () => {
    setAmount((prev) => (prev.includes(".") ? prev : `${prev || "0"}.`));
  };

  const backspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (!userId) return;
    const value = Number(amount);
    if (!description.trim() || !category) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!value || value <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    const mode: PaymentMode = sheetType === "transfer" ? "Bank Transfer" : paymentMode;

    setSubmitting(true);
    const storageDate = toStorageDate(date) || todayStorage();
    try {
      if (isEdit && transaction) {
        await dispatch(
          updateTransaction({
            id: transaction.id,
            userId,
            patch: {
              title: description.trim(),
              description: description.trim(),
              amount: value,
              type: txType,
              category,
              paymentMode: mode,
              mode,
              date: storageDate,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_TRANSACTION_UPDATED);
      } else {
        const newTransaction: Transaction = {
          id: uuidv4(),
          userId,
          title: description.trim(),
          description: description.trim(),
          amount: value,
          type: txType,
          category,
          paymentMode: mode,
          mode,
          date: storageDate,
          isRecurring: false,
          createdAt: new Date().toISOString(),
          imported: false,
        };
        await dispatch(addTransaction(newTransaction)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_TRANSACTION_ADDED);
      }
      onClose();
    } catch {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-visible rounded-t-[28px] bg-surface shadow-elevated sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300 sm:hidden" />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-3">
          <SegmentedTabs
            value={sheetType}
            onChange={(next) => {
              setSheetType(next);
              setCategory("");
            }}
            options={[
              { value: "income", label: UI_TEXT.INCOME },
              { value: "expense", label: UI_TEXT.EXPENSE },
              { value: "transfer", label: UI_TEXT.TRANSFER },
            ]}
          />

          {budgetPct != null && budgetPct >= 50 && !alertDismissed && (
            <AlertBanner
              tone="info"
              title={UI_TEXT.BUDGET_ALERT}
              message={`You've spent ${Math.round(budgetPct)}% of your monthly budget`}
              onDismiss={() => setAlertDismissed(true)}
            />
          )}

          <div className="text-center">
            <p className="text-sm text-gray-400">{UI_TEXT.AMOUNT_PLACEHOLDER}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-brand-deep">{displayAmount}</p>
          </div>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
          />

          <CategoryPicker
            value={category}
            onChange={setCategory}
            type={txType}
            titleHint={description}
            amountHint={Number(amount) || undefined}
            showAiSuggest={Boolean(description.trim())}
            selectClassName="rounded-2xl border-gray-200 py-3"
          />

          <div className="relative">
            <button
              type="button"
              onClick={openDatePicker}
              className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:border-primary-main/40 focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
              aria-label={UI_TEXT.DATE}
            >
              <CalendarTodayIcon className="h-4 w-4 shrink-0 text-primary-main" />
              <span className="flex-1 truncate text-sm font-medium text-brand-deep">{formatDisplayDate(date)}</span>
              <KeyboardArrowDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
            {/* Keep input in-flow for a11y/autofill; open via showPicker so the
                native calendar isn't clipped by the sheet overlay. */}
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pointer-events-none absolute bottom-0 left-3 h-px w-px opacity-0"
              tabIndex={-1}
              aria-hidden
            />
          </div>

          {sheetType !== "transfer" && (
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-primary-main focus:outline-none"
            >
              {PAYMENT_MODES_LIST.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          )}

          <NumericKeypad onDigit={appendDigit} onDecimal={appendDecimal} onBackspace={backspace} />

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-primary-main py-4 text-base font-semibold text-white shadow-elevated transition-opacity disabled:opacity-60"
          >
            {isEdit ? UI_TEXT.SAVE : UI_TEXT.ADD_TRANSACTION}
          </button>
        </div>
      </div>
    </div>
  );
}
