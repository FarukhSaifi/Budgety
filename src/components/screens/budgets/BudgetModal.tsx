"use client";

import { NUMBER_FORMAT, UI_TEXT, VIEW_PERIODS } from "@constants";
import { Button, CategoryPicker, Field, Input, Modal, Select } from "@common";
import { CheckIcon } from "@components/icons";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addBudget, updateBudget } from "@store/slices/budgetsSlice";
import { showError, showSuccess } from "@utils/toast";
import type { Budget, BudgetPeriod } from "@/types";
import { useEffect, useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";

export interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  budget?: Budget | null;
}

export function BudgetModal({ open, onClose, budget }: BudgetModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.uid);
  const { selectedMonth, selectedYear } = useAppSelector((state) => state.ui);
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(budget?.category ?? "");
    setLimitAmount(budget ? String(budget.limitAmount) : "");
    setPeriod(budget?.period ?? "monthly");
  }, [open, budget]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const limit = Number(limitAmount);
    if (!category) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    if (!limit || limit <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }
    setSubmitting(true);
    try {
      if (budget) {
        await dispatch(
          updateBudget({
            id: budget.id,
            userId,
            patch: { category, limitAmount: limit, period },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_BUDGET_UPDATED);
      } else {
        const newBudget: Budget = {
          id: uuidv4(),
          userId,
          category,
          limitAmount: limit,
          currentAmount: 0,
          period,
          month: period === VIEW_PERIODS.MONTHLY ? selectedMonth : undefined,
          year: selectedYear,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addBudget(newBudget)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_BUDGET_ADDED);
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
      title={budget ? `${UI_TEXT.EDIT} ${UI_TEXT.BUDGET}` : UI_TEXT.ADD_NEW_BUDGET_TITLE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button
            type="submit"
            form="budget-form"
            loading={submitting}
            leftIcon={<CheckIcon className="h-4 w-4" />}
          >
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.CATEGORY_PLACEHOLDER} required>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            type="expense"
            showAiSuggest={false}
          />
        </Field>
        <Field label={UI_TEXT.BUDGET_LIMIT} required>
          <Input
            type="number"
            inputMode="decimal"
            step={NUMBER_FORMAT.STEP_VALUE}
            min={0}
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label={UI_TEXT.VIEW_PERIOD_LABEL}>
          <Select value={period} onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}>
            <option value="monthly">{UI_TEXT.MONTHLY_BREAKDOWN}</option>
            <option value="yearly">{UI_TEXT.YEARLY_BREAKDOWN}</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
