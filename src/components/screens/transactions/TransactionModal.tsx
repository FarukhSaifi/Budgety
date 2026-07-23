"use client";

import { useId, useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import {
  CURRENCY_SYMBOL,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";

import { PAYMENT_MODES_LIST } from "@constants/firestore";

import {
  Button,
  CategoryPicker,
  Field,
  Input,
  Modal,
  SegmentedPill,
} from "@common";

import { CheckIcon, DeleteIcon } from "@components/icons";

import { toStorageDate } from "@hooks/useDateFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addTransaction, deleteTransaction, updateTransaction } from "@store/slices/transactionsSlice";
import { applyCategorizationRules } from "@utils/applyCategorizationRules";
import { cn } from "@utils/cn";
import { showError, showSuccess } from "@utils/toast";

import type { PaymentMode, Transaction, TransactionType } from "@/types";

export interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this transaction; otherwise it creates one. */
  transaction?: Transaction | null;
}

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  isRecurring: boolean;
  taxDeductible: boolean;
  isShared: boolean;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState(transaction?: Transaction | null): FormState {
  if (transaction) {
    return {
      type: transaction.type,
      amount: String(transaction.amount ?? ""),
      description: transaction.title ?? transaction.description ?? "",
      category: transaction.category ?? "",
      paymentMode: transaction.paymentMode ?? "Cash",
      date: toStorageDate(transaction.date) || todayInput(),
      isRecurring: Boolean(transaction.isRecurring),
      taxDeductible: Boolean(transaction.taxDeductible),
      isShared: Boolean(transaction.isShared),
    };
  }
  return {
    type: "expense",
    amount: "",
    description: "",
    category: "",
    paymentMode: "Cash",
    date: todayInput(),
    isRecurring: false,
    taxDeductible: false,
    isShared: false,
  };
}

const TYPE_OPTIONS = [
  { value: TRANSACTION_TYPES.EXPENSE, label: UI_TEXT.EXPENSE, tone: "expense" as const },
  { value: TRANSACTION_TYPES.INCOME, label: UI_TEXT.INCOME, tone: "income" as const },
];

export function TransactionModal({ open, onClose, transaction }: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const rules = useAppSelector((state) => state.rules.items);
  const [form, setForm] = useState<FormState>(() => buildInitialState(transaction));
  const [submitting, setSubmitting] = useState(false);
  const amountId = useId();
  const descriptionId = useId();
  const dateId = useId();
  const recurringId = useId();
  const taxId = useId();
  const sharedId = useId();

  useResetOnOpen(open, transaction?.id, () => {
    setForm(buildInitialState(transaction));
  });

  const isEdit = Boolean(transaction);
  const isIncome = form.type === TRANSACTION_TYPES.INCOME;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDelete = async () => {
    if (!transaction) return;
    setSubmitting(true);
    try {
      await dispatch(deleteTransaction(transaction.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_TRANSACTION_DELETED);
      onClose();
    } catch {
      showError(UI_TEXT.AUTH_GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amount = Number(form.amount);
    const ruled =
      form.category.trim() ||
      applyCategorizationRules(form.description.trim(), form.type, rules) ||
      "";
    if (!form.description.trim() || !ruled) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!amount || amount <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    setSubmitting(true);
    const dateIso = new Date(form.date).toISOString();
    const title = form.description.trim();
    try {
      if (isEdit && transaction) {
        await dispatch(
          updateTransaction({
            id: transaction.id,
            userId,
            patch: {
              title,
              description: title,
              amount,
              type: form.type,
              category: ruled,
              paymentMode: form.paymentMode,
              mode: form.paymentMode,
              date: dateIso,
              isRecurring: form.isRecurring,
              taxDeductible: form.taxDeductible,
              isShared: form.isShared,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_TRANSACTION_UPDATED);
      } else {
        const newTransaction: Transaction = {
          id: uuidv4(),
          userId,
          title,
          description: title,
          amount,
          type: form.type,
          category: ruled,
          paymentMode: form.paymentMode,
          mode: form.paymentMode,
          date: dateIso,
          isRecurring: form.isRecurring,
          taxDeductible: form.taxDeductible,
          isShared: form.isShared,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? UI_TEXT.EDIT_TRANSACTION : UI_TEXT.ADD_TRANSACTION}
      footer={
        <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
          {isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={submitting}
              leftIcon={<DeleteIcon className="h-3.5 w-3.5" />}
              className={cn(
                "mr-auto shrink-0 px-2 font-medium text-on-surface-variant",
                "hover:bg-expense-soft/70 hover:text-expense",
              )}
            >
              {UI_TEXT.DELETE}
            </Button>
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="min-w-20 sm:min-w-24"
            >
              {UI_TEXT.CANCEL}
            </Button>
            <Button
              type="submit"
              form="transaction-form"
              loading={submitting}
              leftIcon={<CheckIcon className="h-4 w-4" />}
              className="min-w-24 sm:min-w-28"
            >
              {UI_TEXT.SAVE}
            </Button>
          </div>
        </div>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-5">
        <SegmentedPill
          ariaLabel={UI_TEXT.TYPE_LABEL}
          options={TYPE_OPTIONS}
          value={form.type}
          onChange={(next) => {
            update("type", next as TransactionType);
            update("category", "");
          }}
        />

        {/* Amount — primary visual focus */}
        <div
          className={cn(
            "rounded-2xl p-3.5 ring-1 transition-colors",
            isIncome
              ? "bg-income-soft/40 ring-income/20"
              : "bg-expense-soft/40 ring-expense/20",
          )}
        >
          <Field label={UI_TEXT.AMOUNT} htmlFor={amountId} required className="space-y-2">
            <div className="relative">
              <span
                className={cn(
                  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-semibold tabular-nums",
                  isIncome ? "text-income" : "text-expense",
                )}
                aria-hidden="true"
              >
                {CURRENCY_SYMBOL}
              </span>
              <Input
                id={amountId}
                type="number"
                inputMode="decimal"
                step={NUMBER_FORMAT.STEP_VALUE}
                min={0}
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="0.00"
                className={cn(
                  "h-14 border-transparent bg-card/90 pl-9 text-2xl font-bold tabular-nums tracking-tight shadow-sm",
                  "placeholder:font-medium placeholder:text-outline",
                  isIncome
                    ? "focus:border-income focus:ring-income/25"
                    : "focus:border-expense focus:ring-expense/25",
                )}
              />
            </div>
          </Field>
        </div>

        <div className="space-y-4">
          <Field label={UI_TEXT.DESCRIPTION} htmlFor={descriptionId} required>
            <Input
              id={descriptionId}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
              autoComplete="off"
            />
          </Field>

          <Field label={UI_TEXT.CATEGORY_PLACEHOLDER} required>
            <CategoryPicker
              value={form.category}
              onChange={(category) => update("category", category)}
              type={form.type}
              titleHint={form.description}
              amountHint={Number(form.amount) || undefined}
              showAiSuggest={Boolean(form.description.trim())}
            />
          </Field>
        </div>

        <Field label={UI_TEXT.MODE_LABEL}>
          <div
            role="radiogroup"
            aria-label={UI_TEXT.MODE_LABEL}
            className="flex flex-wrap gap-2"
          >
            {PAYMENT_MODES_LIST.map((mode) => {
              const active = form.paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update("paymentMode", mode)}
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
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.DATE_PLACEHOLDER} htmlFor={dateId} required>
            <Input
              id={dateId}
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>

          <Field label={UI_TEXT.RECURRING} htmlFor={recurringId}>
            <label
              htmlFor={recurringId}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
                form.isRecurring
                  ? "border-primary-main/40 bg-primary-soft/50"
                  : "border-outline-variant bg-card hover:bg-surface-low/60",
              )}
            >
              <span className="text-sm text-on-surface-variant">{UI_TEXT.RECURRING_PAYMENT}</span>
              <input
                id={recurringId}
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => update("isRecurring", e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-outline-variant text-primary-main focus:ring-primary-main/30"
              />
            </label>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            htmlFor={taxId}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
              form.taxDeductible
                ? "border-primary-main/40 bg-primary-soft/50"
                : "border-outline-variant bg-card hover:bg-surface-low/60",
            )}
          >
            <span className="text-sm text-on-surface-variant">{UI_TEXT.TAX_DEDUCTIBLE}</span>
            <input
              id={taxId}
              type="checkbox"
              checked={form.taxDeductible}
              onChange={(e) => update("taxDeductible", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-outline-variant text-primary-main focus:ring-primary-main/30"
            />
          </label>
          <label
            htmlFor={sharedId}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors",
              form.isShared
                ? "border-primary-main/40 bg-primary-soft/50"
                : "border-outline-variant bg-card hover:bg-surface-low/60",
            )}
          >
            <span className="text-sm text-on-surface-variant">{UI_TEXT.SHARED_EXPENSE}</span>
            <input
              id={sharedId}
              type="checkbox"
              checked={form.isShared}
              onChange={(e) => update("isShared", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-outline-variant text-primary-main focus:ring-primary-main/30"
            />
          </label>
        </div>
      </form>
    </Modal>
  );
}
