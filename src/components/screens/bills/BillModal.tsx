"use client";

import { useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import { DATE_CONSTANTS, NUMBER_FORMAT, RECURRENCE_LABELS, RECURRENCE_TYPES, UI_TEXT } from "@constants";

import { Button, Field, Input, Modal, Select } from "@common";

import { toStorageDate } from "@hooks/useDateFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addBill, updateBill } from "@store/slices/billsSlice";
import { showError, showSuccess } from "@utils/toast";

import type { Bill, RecurrenceType } from "@/types";


export interface BillModalProps {
  open: boolean;
  onClose: () => void;
  bill?: Bill | null;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BillModal({ open, onClose, bill }: BillModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayInput());
  const [recurrence, setRecurrence] = useState<RecurrenceType>("monthly");
  const [isRecurring, setIsRecurring] = useState(true);
  const [reminderDays, setReminderDays] = useState(String(DATE_CONSTANTS.DEFAULT_REMINDER_DAYS));
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, bill?.id, () => {
    setTitle(bill?.title ?? bill?.name ?? "");
    setAmount(bill ? String(bill.amount) : "");
    setDueDate(bill ? toStorageDate(bill.dueDate) || todayInput() : todayInput());
    setRecurrence((bill?.recurrence as RecurrenceType) ?? "monthly");
    setIsRecurring(bill ? bill.isRecurring !== false : true);
    setReminderDays(String(bill?.reminderDays ?? DATE_CONSTANTS.DEFAULT_REMINDER_DAYS));
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amt = Number(amount);
    if (!title.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!amt || amt <= 0) {
      showError(UI_TEXT.BILL_AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }
    setSubmitting(true);
    const dueIso = new Date(dueDate).toISOString();
    try {
      if (bill) {
        await dispatch(
          updateBill({
            id: bill.id,
            userId,
            patch: {
              title: title.trim(),
              name: title.trim(),
              amount: amt,
              dueDate: dueIso,
              recurrence,
              isRecurring,
              reminderDays: Number(reminderDays) || DATE_CONSTANTS.DEFAULT_REMINDER_DAYS,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_BILL_UPDATED);
      } else {
        const newBill: Bill = {
          id: uuidv4(),
          userId,
          title: title.trim(),
          name: title.trim(),
          amount: amt,
          dueDate: dueIso,
          recurrence,
          status: "pending",
          isPaid: false,
          paidDate: null,
          isRecurring,
          reminderDays: Number(reminderDays) || DATE_CONSTANTS.DEFAULT_REMINDER_DAYS,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addBill(newBill)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_BILL_ADDED);
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
      title={bill ? UI_TEXT.EDIT : UI_TEXT.ADD_BILL_REMINDER_TITLE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="bill-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.BILL_NAME} required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={UI_TEXT.BILL_NAME_PLACEHOLDER} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Field label={UI_TEXT.DUE_DATE} required>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.RECURRING}>
            <Select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              {Object.values(RECURRENCE_TYPES).map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={UI_TEXT.REMIND_ME_DAYS_BEFORE}>
            <Input
              type="number"
              min={0}
              max={DATE_CONSTANTS.MAX_REMINDER_DAYS}
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
          />
          {UI_TEXT.RECURRING_BILL}
        </label>
      </form>
    </Modal>
  );
}
