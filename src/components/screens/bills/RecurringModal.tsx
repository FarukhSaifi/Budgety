"use client";

import {
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { Button, CategoryPicker, Field, Input, Modal, Select } from "@common";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addRecurring, updateRecurring } from "@store/slices/recurringSlice";
import { showError, showSuccess } from "@utils/toast";
import { toStorageDate } from "@hooks/useDateFormatter";
import type { RecurrenceType, RecurringTransaction, TransactionType } from "@/types";
import { useEffect, useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";

export interface RecurringModalProps {
  open: boolean;
  onClose: () => void;
  recurring?: RecurringTransaction | null;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecurringModal({ open, onClose, recurring }: RecurringModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("monthly");
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(recurring?.type ?? "expense");
    setDescription(recurring?.description ?? "");
    setCategory(recurring?.category ?? "");
    setAmount(recurring ? String(recurring.amount) : "");
    setRecurrence((recurring?.recurrence as RecurrenceType) ?? "monthly");
    setStartDate(recurring ? toStorageDate(recurring.startDate) || todayInput() : todayInput());
    setEndDate(recurring?.endDate ? toStorageDate(recurring.endDate) : "");
  }, [open, recurring]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amt = Number(amount);
    if (!description.trim() || !category) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!amt || amt <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }
    setSubmitting(true);
    const startIso = new Date(startDate).toISOString();
    const endIso = endDate ? new Date(endDate).toISOString() : null;
    try {
      if (recurring) {
        await dispatch(
          updateRecurring({
            id: recurring.id,
            userId,
            patch: {
              type,
              description: description.trim(),
              category,
              amount: amt,
              recurrence,
              startDate: startIso,
              endDate: endIso,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_RECURRING_UPDATED);
      } else {
        const item: RecurringTransaction = {
          id: uuidv4(),
          userId,
          type,
          description: description.trim(),
          category,
          amount: amt,
          recurrence,
          startDate: startIso,
          endDate: endIso,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addRecurring(item)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_RECURRING_ADDED);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recurring ? UI_TEXT.EDIT : UI_TEXT.ADD_RECURRING_TRANSACTION_TITLE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="recurring-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="recurring-form" onSubmit={handleSubmit} className="space-y-4">
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
                setType(value as TransactionType);
                setCategory("");
              }}
              className={
                "rounded-lg py-2 text-sm font-medium transition-colors " +
                (type === value ? "bg-white text-primary-main shadow-sm" : "text-gray-500")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <Field label={UI_TEXT.DESCRIPTION_PLACEHOLDER} required>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.CATEGORY_PLACEHOLDER} required>
            <CategoryPicker
              value={category}
              onChange={setCategory}
              type={type}
              titleHint={description}
              amountHint={Number(amount) || undefined}
              showAiSuggest={Boolean(description.trim())}
            />
          </Field>
          <Field label={UI_TEXT.AMOUNT_PLACEHOLDER} required>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>
        <Field label={UI_TEXT.RECURRING}>
          <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}>
            {Object.values(RECURRENCE_TYPES).map((r) => (
              <option key={r} value={r}>
                {RECURRENCE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.START_DATE} required>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label={UI_TEXT.END_DATE_OPTIONAL}>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
