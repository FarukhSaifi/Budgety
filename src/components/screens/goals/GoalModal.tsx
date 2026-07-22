"use client";

import { NUMBER_FORMAT, UI_TEXT } from "@constants";
import { Button, Field, Input, Modal } from "@common";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addGoal, updateGoal } from "@store/slices/goalsSlice";
import { showError, showSuccess } from "@utils/toast";
import { toStorageDate } from "@hooks/useDateFormatter";
import type { Goal } from "@/types";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";

export interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GoalModal({ open, onClose, goal }: GoalModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [targetDate, setTargetDate] = useState(todayInput());
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, goal?.id, () => {
    setTitle(goal?.title ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setSavedAmount(goal ? String(goal.savedAmount) : "");
    setTargetDate(goal ? toStorageDate(goal.targetDate) || todayInput() : todayInput());
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const target = Number(targetAmount);
    const saved = Number(savedAmount) || 0;
    if (!title.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!target || target <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }
    setSubmitting(true);
    const dateIso = new Date(targetDate).toISOString();
    try {
      if (goal) {
        await dispatch(
          updateGoal({
            id: goal.id,
            userId,
            patch: {
              title: title.trim(),
              targetAmount: target,
              savedAmount: saved,
              targetDate: dateIso,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_GOAL_ADDED);
      } else {
        const newGoal: Goal = {
          id: uuidv4(),
          userId,
          title: title.trim(),
          targetAmount: target,
          savedAmount: saved,
          targetDate: dateIso,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addGoal(newGoal)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_GOAL_ADDED);
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
      title={goal ? UI_TEXT.EDIT : UI_TEXT.ADD_NEW_SAVINGS_GOAL_TITLE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="goal-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.GOAL_NAME} required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={UI_TEXT.GOAL_NAME} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.TARGET_AMOUNT} required>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label={UI_TEXT.CURRENT_AMOUNT}>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={savedAmount}
              onChange={(e) => setSavedAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>
        <Field label={UI_TEXT.DATE_PLACEHOLDER}>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
