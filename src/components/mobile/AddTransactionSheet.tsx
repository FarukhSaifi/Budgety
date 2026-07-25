"use client";

import { useMemo, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import { CURRENCY_SYMBOL, NUMBER_FORMAT, TRANSACTION_TYPES, UI_TEXT } from "@constants";

import { PAYMENT_MODES_LIST } from "@constants/firestore";

import { CategoryPicker } from "@common";

import { CalendarTodayIcon } from "@components/icons";

import { toStorageDate } from "@hooks/useDateFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addTransaction, updateTransaction } from "@store/slices/transactionsSlice";
import { cn } from "@utils/cn";
import { todayStorage } from "@utils/dateUtils";
import { showError, showSuccess } from "@utils/toast";

import type { PaymentMode, Transaction, TransactionType } from "@/types";

import { AlertBanner } from "./AlertBanner";
import { FilterPills } from "./FilterPills";
import { NumericKeypad } from "./NumericKeypad";

type SheetType = "income" | "expense" | "transfer";

const SHEET_TYPE_OPTIONS = [
  { value: "income" as const, label: UI_TEXT.INCOME, tone: "income" as const },
  { value: "expense" as const, label: UI_TEXT.EXPENSE, tone: "expense" as const },
  { value: "transfer" as const, label: UI_TEXT.TRANSFER, tone: "brand" as const },
];

export interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  budgetPct?: number | null;
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

  const txType: TransactionType =
    sheetType === "income" ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.EXPENSE;

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/65" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-visible rounded-t-[28px] bg-surface shadow-elevated sm:rounded-[28px]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-outline-variant sm:hidden" />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-3">
          <FilterPills
            ariaLabel={UI_TEXT.TYPE_LABEL}
            value={sheetType}
            onChange={(next) => {
              setSheetType(next);
              setCategory("");
            }}
            options={SHEET_TYPE_OPTIONS}
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
            <p className="text-sm text-on-surface-variant">{UI_TEXT.AMOUNT_PLACEHOLDER}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-brand-deep">{displayAmount}</p>
          </div>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
            className="w-full rounded-2xl border border-outline-variant bg-card px-4 py-3 text-sm text-brand-deep placeholder:text-outline focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-main/20"
          />

          <CategoryPicker
            value={category}
            onChange={setCategory}
            type={txType}
            titleHint={description}
            amountHint={Number(amount) || undefined}
            showAiSuggest={Boolean(description.trim())}
            selectClassName="[&>button]:rounded-2xl [&>button]:border-outline-variant [&>button]:px-4 [&>button]:py-3"
          />

          <label className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border border-outline-variant bg-card px-3 py-3 transition-colors focus-within:border-primary-main focus-within:ring-2 focus-within:ring-primary-main/20 hover:border-primary-main/40">
            <CalendarTodayIcon className="h-4 w-4 shrink-0 text-primary-main" aria-hidden />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={UI_TEXT.DATE}
              className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-brand-deep outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </label>

          {sheetType !== "transfer" && (
            <div role="radiogroup" aria-label={UI_TEXT.MODE_LABEL} className="flex flex-wrap gap-2">
              {PAYMENT_MODES_LIST.map((mode) => {
                const active = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPaymentMode(mode)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-1",
                      active
                        ? "bg-primary-light text-white shadow-sm"
                        : "bg-surface-low text-on-surface-variant ring-1 ring-outline-variant/70 hover:text-brand-deep",
                    )}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
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
