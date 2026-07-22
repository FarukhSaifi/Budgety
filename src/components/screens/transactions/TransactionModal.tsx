"use client";

import {
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { PAYMENT_MODES_LIST } from "@constants/firestore";
import { Button, CategoryPicker, Field, Input, Modal, Select } from "@common";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addTransaction, deleteTransaction, updateTransaction } from "@store/slices/transactionsSlice";
import { showError, showSuccess } from "@utils/toast";
import { toStorageDate } from "@hooks/useDateFormatter";
import type { PaymentMode, Transaction, TransactionType } from "@/types";
import { useEffect, useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";

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
  };
}

export function TransactionModal({ open, onClose, transaction }: TransactionModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const [form, setForm] = useState<FormState>(buildInitialState(transaction));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(buildInitialState(transaction));
  }, [open, transaction]);

  const isEdit = Boolean(transaction);

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
    if (!form.description.trim() || !form.category) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!amount || amount <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    setSubmitting(true);
    const dateIso = new Date(form.date).toISOString();
    try {
      if (isEdit && transaction) {
        await dispatch(
          updateTransaction({
            id: transaction.id,
            userId,
            patch: {
              title: form.description.trim(),
              description: form.description.trim(),
              amount,
              type: form.type,
              category: form.category,
              paymentMode: form.paymentMode,
              mode: form.paymentMode,
              date: dateIso,
              isRecurring: form.isRecurring,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_TRANSACTION_UPDATED);
      } else {
        const newTransaction: Transaction = {
          id: uuidv4(),
          userId,
          title: form.description.trim(),
          description: form.description.trim(),
          amount,
          type: form.type,
          category: form.category,
          paymentMode: form.paymentMode,
          mode: form.paymentMode,
          date: dateIso,
          isRecurring: form.isRecurring,
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
        <>
          {isEdit && (
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {UI_TEXT.DELETE}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="transaction-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          {(
            [
              [TRANSACTION_TYPES.EXPENSE, UI_TEXT.EXPENSE],
              [TRANSACTION_TYPES.INCOME, UI_TEXT.INCOME],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                update("type", value as TransactionType);
                update("category", "");
              }}
              className={
                "rounded-lg py-2 text-sm font-medium transition-colors " +
                (form.type === value
                  ? value === "income"
                    ? "bg-white text-income shadow-sm"
                    : "bg-white text-expense shadow-sm"
                  : "text-gray-500")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <Field label={UI_TEXT.AMOUNT_PLACEHOLDER} required>
          <Input
            type="number"
            inputMode="decimal"
            step={NUMBER_FORMAT.STEP_VALUE}
            min={0}
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="0.00"
          />
        </Field>

        <Field label={UI_TEXT.DESCRIPTION_PLACEHOLDER} required>
          <Input
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
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

        <Field label={UI_TEXT.MODE_LABEL}>
          <Select
            value={form.paymentMode}
            onChange={(e) => update("paymentMode", e.target.value as PaymentMode)}
          >
            {PAYMENT_MODES_LIST.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={UI_TEXT.DATE_PLACEHOLDER} required>
          <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => update("isRecurring", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
          />
          {UI_TEXT.RECURRING}
        </label>
      </form>
    </Modal>
  );
}
