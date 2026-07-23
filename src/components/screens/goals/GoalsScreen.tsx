"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CURRENCY_SYMBOL, PERCENTAGE_THRESHOLDS, UI_TEXT } from "@constants";

import { Badge, Button, ConfirmDialog, EmptyState, ProgressBar, StatCard } from "@common";

import { AddIcon, DeleteIcon, EditIcon, FlagIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { deleteGoal } from "@store/slices/goalsSlice";
import { cn } from "@utils/cn";
import { hapticTap } from "@utils/feedback";
import { showSuccess } from "@utils/toast";

import type { Goal } from "@/types";

import { GoalModal } from "./GoalModal";

export function GoalsScreen() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector((state) => state.goals.items);
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pulseGoalId, setPulseGoalId] = useState<string | null>(null);
  const achievedRef = useRef<Record<string, boolean>>({});

  const totals = useMemo(
    () =>
      goals.reduce(
        (acc, g) => ({
          target: acc.target + (g.targetAmount || 0),
          saved: acc.saved + (g.savedAmount || 0),
        }),
        { target: 0, saved: 0 },
      ),
    [goals],
  );

  useEffect(() => {
    const timers: number[] = [];
    goals.forEach((g) => {
      const percent = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
      const achieved = percent >= PERCENTAGE_THRESHOLDS.MAX;
      const prev = achievedRef.current[g.id];
      if (prev === undefined) {
        achievedRef.current[g.id] = achieved;
        return;
      }
      if (!prev && achieved) {
        setPulseGoalId(g.id);
        hapticTap();
        timers.push(
          window.setTimeout(() => {
            setPulseGoalId((current) => (current === g.id ? null : current));
          }, 900),
        );
      }
      achievedRef.current[g.id] = achieved;
    });
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [goals]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteGoal(pendingDelete.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_GOAL_DELETED);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-deep">{UI_TEXT.GOALS}</h2>
          <p className="text-sm text-gray-500">{UI_TEXT.SAVINGS_GOALS}</p>
        </div>
        <Button leftIcon={<AddIcon className="h-4 w-4" />} onClick={openAdd}>
          {UI_TEXT.ADD_GOAL}
        </Button>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={UI_TEXT.TOTAL_GOALS} value={goals.length} tone="brand" />
          <StatCard label={UI_TEXT.TOTAL_TARGET} value={`${CURRENCY_SYMBOL}${formatCurrency(totals.target)}`} />
          <StatCard
            label={UI_TEXT.TOTAL_SAVED}
            value={`${CURRENCY_SYMBOL}${formatCurrency(totals.saved)}`}
            tone="income"
          />
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={<FlagIcon className="h-5 w-5" />}
          title={UI_TEXT.NO_GOALS}
          action={<Button onClick={openAdd}>{UI_TEXT.ADD_GOAL}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const percent = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
            const achieved = percent >= PERCENTAGE_THRESHOLDS.MAX;
            const pulsing = pulseGoalId === g.id;
            return (
              <div
                key={g.id}
                className={cn(
                  "rounded-card border border-gray-100 bg-white p-4 shadow-card",
                  pulsing && "motion-goal-pulse",
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-brand-deep">{g.title}</p>
                    <p className="text-xs text-gray-400">
                      {UI_TEXT.DUE} {formatDate(g.targetDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-main"
                      aria-label={UI_TEXT.EDIT}
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(g)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-expense"
                      aria-label={UI_TEXT.DELETE}
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-end justify-between">
                  <p className="text-lg font-semibold tabular-nums text-gray-900">
                    {CURRENCY_SYMBOL}
                    {formatCurrency(g.savedAmount)}
                  </p>
                  <p className="text-sm tabular-nums text-gray-500">
                    / {CURRENCY_SYMBOL}
                    {formatCurrency(g.targetAmount)}
                  </p>
                </div>

                <ProgressBar value={percent} colorClassName={achieved ? "bg-income" : "bg-primary-main"} />

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium tabular-nums text-gray-500">
                    {UI_TEXT.PROGRESS}: {percent.toFixed(0)}%
                  </span>
                  {achieved && (
                    <Badge tone="success" className={cn(pulsing && "motion-goal-pulse")}>
                      {UI_TEXT.GOAL_COMPLETE_BADGE}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalModal open={modalOpen} onClose={() => setModalOpen(false)} goal={editing} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={UI_TEXT.DELETE_GOAL_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_GOAL}
        confirmLabel={UI_TEXT.DELETE}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
