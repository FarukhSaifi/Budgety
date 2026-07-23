"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import { CURRENCY_SYMBOL, NUMBER_FORMAT, UI_TEXT } from "@constants";

import { Button, ConfirmDialog, EmptyState, Field, Input, Modal, Select } from "@common";

import {
  AddIcon,
  CheckCircleIcon,
  DeleteIcon,
  EditIcon,
  GroupIcon,
  MoreVertIcon,
  ReceiptLongIcon,
} from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  addSplitExpense,
  addSplitParticipant,
  deleteSplitExpense,
  deleteSplitParticipant,
  updateSplitExpense,
} from "@store/slices/splitSlice";
import { cn } from "@utils/cn";
import { showError, showSuccess } from "@utils/toast";

import type { SplitExpense, SplitParticipant } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compute the net balance for each participant relative to "You".
 * Positive = others owe You; Negative = You owe others.
 */
function computeBalances(
  participants: SplitParticipant[],
  expenses: SplitExpense[],
  youId: string,
): Map<string, number> {
  const balances = new Map<string, number>(participants.map((p) => [p.id, 0]));

  for (const exp of expenses) {
    if (exp.settled) continue;
    const splitCount = exp.participantIds.length;
    if (splitCount === 0) continue;

    const share = exp.amount / splitCount;
    const paidByYou = exp.paidById === youId;

    for (const pid of exp.participantIds) {
      if (pid === youId) continue;
      // If You paid: others owe You their share → You are owed (+)
      // If someone else paid: You owe your share if You is in participants (-)
      if (paidByYou) {
        balances.set(youId, (balances.get(youId) ?? 0) + share);
        balances.set(pid, (balances.get(pid) ?? 0) - share);
      } else if (exp.paidById === pid && exp.participantIds.includes(youId)) {
        // pid paid, you are in the split → you owe pid
        const yourShare = exp.amount / splitCount;
        balances.set(youId, (balances.get(youId) ?? 0) - yourShare);
        balances.set(pid, (balances.get(pid) ?? 0) + yourShare);
      }
    }
  }

  return balances;
}

// ---------------------------------------------------------------------------
// Participant item row
// ---------------------------------------------------------------------------

function ParticipantRow({
  participant,
  isYou,
  onDelete,
}: {
  participant: SplitParticipant;
  isYou: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/40 bg-card px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-main">
          {participant.name.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-medium text-brand-deep">
          {participant.name}
          {isYou && (
            <span className="ml-1.5 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary-main">
              You
            </span>
          )}
        </span>
      </div>
      {!isYou && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-expense"
          aria-label={`Remove ${participant.name}`}
        >
          <DeleteIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add participant modal
// ---------------------------------------------------------------------------

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

function AddParticipantModal({ open, onClose, onAdd }: AddParticipantModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, null, () => setName(""));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={UI_TEXT.ADD_PARTICIPANT}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="add-participant-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="add-participant-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.PARTICIPANT_NAME} required>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Alice"
          />
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit expense modal
// ---------------------------------------------------------------------------

interface SplitExpenseModalProps {
  open: boolean;
  onClose: () => void;
  expense?: SplitExpense | null;
  participants: SplitParticipant[];
  youId: string;
}

function SplitExpenseModal({
  open,
  onClose,
  expense,
  participants,
  youId,
}: SplitExpenseModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInput());
  const [paidById, setPaidById] = useState(youId);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, expense?.id, () => {
    setTitle(expense?.title ?? "");
    setAmount(expense ? String(expense.amount) : "");
    setDate(expense?.date ? new Date(expense.date).toISOString().slice(0, 10) : todayInput());
    setPaidById(expense?.paidById ?? youId);
    setSelectedParticipantIds(expense?.participantIds ?? participants.map((p) => p.id));
  });

  const toggleParticipant = (pid: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!title.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }
    if (selectedParticipantIds.length === 0) {
      showError("Select at least one participant.");
      return;
    }

    setSubmitting(true);
    try {
      const dateIso = new Date(date).toISOString();
      if (expense) {
        await dispatch(
          updateSplitExpense({
            id: expense.id,
            userId,
            patch: {
              title: title.trim(),
              amount: amt,
              date: dateIso,
              paidById,
              participantIds: selectedParticipantIds,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_SPLIT_EXPENSE_UPDATED);
      } else {
        const newExpense: SplitExpense = {
          id: uuidv4(),
          userId,
          title: title.trim(),
          amount: amt,
          date: dateIso,
          paidById,
          participantIds: selectedParticipantIds,
          settled: false,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addSplitExpense(newExpense)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_SPLIT_EXPENSE_ADDED);
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
      title={expense ? UI_TEXT.EDIT_SPLIT_EXPENSE : UI_TEXT.ADD_SPLIT_EXPENSE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="split-expense-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="split-expense-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.SPLIT_EXPENSE_TITLE} required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dinner at Cafe"
          />
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
          <Field label={UI_TEXT.DATE_PLACEHOLDER}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label={UI_TEXT.PAID_BY} required>
          <Select value={paidById} onChange={(e) => setPaidById(e.target.value)}>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={UI_TEXT.SPLIT_PARTICIPANTS} required>
          <div className="space-y-2 rounded-xl border border-outline-variant/50 bg-surface-low/50 p-3">
            {participants.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-deep"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-primary-main"
                  checked={selectedParticipantIds.includes(p.id)}
                  onChange={() => toggleParticipant(p.id)}
                />
                {p.name}
                {p.id === youId && (
                  <span className="text-[10px] font-semibold text-primary-main">(You)</span>
                )}
              </label>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Expense card context menu
// ---------------------------------------------------------------------------

function ExpenseCardMenu({
  onEdit,
  onDelete,
  onToggleSettle,
  settled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onToggleSettle: () => void;
  settled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        aria-label={UI_TEXT.MORE_OPTIONS}
        aria-expanded={open}
      >
        <MoreVertIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-elevated">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onToggleSettle();
            }}
          >
            <CheckCircleIcon className="h-4 w-4" />
            {settled ? UI_TEXT.MARK_UNSETTLED : UI_TEXT.MARK_SETTLED}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            <EditIcon className="h-4 w-4" />
            {UI_TEXT.EDIT}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-expense hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <DeleteIcon className="h-4 w-4" />
            {UI_TEXT.DELETE}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function SplitScreen() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const { participants, expenses } = useAppSelector((s) => s.split);
  const { formatCurrency } = useCurrencyFormatter();

  const [participantModalOpen, setParticipantModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SplitExpense | null>(null);
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState<SplitExpense | null>(null);
  const [pendingDeleteParticipant, setPendingDeleteParticipant] =
    useState<SplitParticipant | null>(null);
  const [deletingExpense, setDeletingExpense] = useState(false);
  const [deletingParticipant, setDeletingParticipant] = useState(false);

  // Ensure "You" participant exists
  const youParticipant = useMemo(
    () => participants.find((p) => p.name === UI_TEXT.YOU_PARTICIPANT),
    [participants],
  );

  useEffect(() => {
    if (!userId || youParticipant) return;
    void dispatch(
      addSplitParticipant({
        id: uuidv4(),
        userId,
        name: UI_TEXT.YOU_PARTICIPANT,
      }),
    );
  }, [dispatch, userId, youParticipant]);

  const youId = youParticipant?.id ?? "";

  const balances = useMemo(
    () => (youId ? computeBalances(participants, expenses, youId) : new Map<string, number>()),
    [participants, expenses, youId],
  );

  const openEditExpense = (exp: SplitExpense) => {
    setEditingExpense(exp);
    setExpenseModalOpen(true);
  };

  const handleToggleSettle = async (exp: SplitExpense) => {
    if (!userId) return;
    const willSettle = !exp.settled;
    await dispatch(
      updateSplitExpense({
        id: exp.id,
        userId,
        patch: { settled: willSettle },
      }),
    ).unwrap();
    showSuccess(willSettle ? UI_TEXT.SUCCESS_SPLIT_SETTLED : UI_TEXT.SUCCESS_SPLIT_UNSETTLED);
  };

  const confirmDeleteExpense = async () => {
    if (!pendingDeleteExpense) return;
    setDeletingExpense(true);
    try {
      await dispatch(deleteSplitExpense(pendingDeleteExpense.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_SPLIT_EXPENSE_DELETED);
      setPendingDeleteExpense(null);
    } finally {
      setDeletingExpense(false);
    }
  };

  const confirmDeleteParticipant = async () => {
    if (!pendingDeleteParticipant) return;
    setDeletingParticipant(true);
    try {
      await dispatch(deleteSplitParticipant(pendingDeleteParticipant.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_PARTICIPANT_DELETED);
      setPendingDeleteParticipant(null);
    } finally {
      setDeletingParticipant(false);
    }
  };

  const handleAddParticipant = async (name: string) => {
    if (!userId) return;
    await dispatch(
      addSplitParticipant({ id: uuidv4(), userId, name }),
    ).unwrap();
    showSuccess(UI_TEXT.SUCCESS_PARTICIPANT_ADDED);
  };

  // Split expenses into active and settled
  const activeExpenses = expenses.filter((e) => !e.settled);
  const settledExpenses = expenses.filter((e) => e.settled);

  const otherParticipants = participants.filter((p) => p.id !== youId);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:max-w-2xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-deep">
            {UI_TEXT.SPLIT_TRACKER}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{UI_TEXT.SPLIT_TRACKER_SUBTITLE}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<AddIcon className="h-4 w-4" />}
          onClick={() => {
            setEditingExpense(null);
            setExpenseModalOpen(true);
          }}
          disabled={participants.length < 2}
        >
          {UI_TEXT.ADD_SPLIT_EXPENSE}
        </Button>
      </header>

      {/* Participants */}
      <section className="rounded-card border border-outline-variant/50 bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GroupIcon className="h-4 w-4 text-primary-main" />
            <p className="text-sm font-semibold text-brand-deep">Participants</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<AddIcon className="h-3.5 w-3.5" />}
            onClick={() => setParticipantModalOpen(true)}
          >
            {UI_TEXT.ADD_PARTICIPANT}
          </Button>
        </div>

        {participants.length === 0 ? (
          <p className="text-center text-sm text-on-surface-variant py-4">
            {UI_TEXT.NO_PARTICIPANTS}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                isYou={p.id === youId}
                onDelete={() => setPendingDeleteParticipant(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Balance Summary */}
      {youId && otherParticipants.length > 0 && (
        <section className="rounded-card border border-primary-soft/40 bg-card p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold text-brand-deep">{UI_TEXT.BALANCE_SUMMARY}</p>
          <div className="space-y-2">
            {otherParticipants.map((p) => {
              const bal = balances.get(p.id) ?? 0;
              const rounded = Math.round(bal * 100) / 100;
              const isOwed = rounded < 0; // Negative for p means p owes You → You are owed from p
              const isEven = Math.abs(rounded) < 0.01;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-surface-low/60 px-3.5 py-2.5"
                >
                  <span className="text-sm font-medium text-brand-deep">{p.name}</span>
                  {isEven ? (
                    <span className="text-xs text-on-surface-variant">Settled up</span>
                  ) : isOwed ? (
                    <span className="text-sm font-semibold text-income">
                      owes you {CURRENCY_SYMBOL}{formatCurrency(Math.abs(rounded))}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-expense">
                      you owe {CURRENCY_SYMBOL}{formatCurrency(Math.abs(rounded))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Expenses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-deep">
            {UI_TEXT.UNSETTLED} ({activeExpenses.length})
          </p>
        </div>

        {activeExpenses.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongIcon className="h-6 w-6" />}
            title={UI_TEXT.NO_SPLIT_EXPENSES}
            description={
              participants.length < 2
                ? "Add participants first, then log shared expenses."
                : undefined
            }
            action={
              participants.length >= 2 ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<AddIcon className="h-4 w-4" />}
                  onClick={() => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  }}
                >
                  {UI_TEXT.ADD_SPLIT_EXPENSE}
                </Button>
              ) : undefined
            }
          />
        ) : (
          activeExpenses.map((exp) => {
            const payer = participants.find((p) => p.id === exp.paidById);
            const share = exp.participantIds.length > 0 ? exp.amount / exp.participantIds.length : 0;

            return (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                payer={payer}
                share={share}
                participants={participants}
                youId={youId}
                formatCurrency={formatCurrency}
                onEdit={() => openEditExpense(exp)}
                onDelete={() => setPendingDeleteExpense(exp)}
                onToggleSettle={() => void handleToggleSettle(exp)}
              />
            );
          })
        )}
      </section>

      {/* Settled Expenses */}
      {settledExpenses.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-on-surface-variant">
            {UI_TEXT.SETTLED} ({settledExpenses.length})
          </p>
          {settledExpenses.map((exp) => {
            const payer = participants.find((p) => p.id === exp.paidById);
            const share = exp.participantIds.length > 0 ? exp.amount / exp.participantIds.length : 0;

            return (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                payer={payer}
                share={share}
                participants={participants}
                youId={youId}
                formatCurrency={formatCurrency}
                onEdit={() => openEditExpense(exp)}
                onDelete={() => setPendingDeleteExpense(exp)}
                onToggleSettle={() => void handleToggleSettle(exp)}
              />
            );
          })}
        </section>
      )}

      <AddParticipantModal
        open={participantModalOpen}
        onClose={() => setParticipantModalOpen(false)}
        onAdd={handleAddParticipant}
      />

      <SplitExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        expense={editingExpense}
        participants={participants}
        youId={youId}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteExpense)}
        title={UI_TEXT.DELETE_SPLIT_EXPENSE_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_SPLIT_EXPENSE}
        confirmLabel={UI_TEXT.DELETE}
        loading={deletingExpense}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setPendingDeleteExpense(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteParticipant)}
        title="Remove Participant"
        message={`Remove "${pendingDeleteParticipant?.name}" from participants?`}
        confirmLabel={UI_TEXT.DELETE}
        loading={deletingParticipant}
        onConfirm={confirmDeleteParticipant}
        onCancel={() => setPendingDeleteParticipant(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expense card (extracted for reuse with active/settled lists)
// ---------------------------------------------------------------------------

function ExpenseCard({
  expense,
  payer,
  share,
  participants,
  youId,
  formatCurrency,
  onEdit,
  onDelete,
  onToggleSettle,
}: {
  expense: SplitExpense;
  payer: SplitParticipant | undefined;
  share: number;
  participants: SplitParticipant[];
  youId: string;
  formatCurrency: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSettle: () => void;
}) {
  const splitNames = expense.participantIds
    .map((id) => participants.find((p) => p.id === id)?.name ?? id)
    .join(", ");

  return (
    <article
      className={cn(
        "rounded-card border bg-card p-4 shadow-card",
        expense.settled
          ? "border-outline-variant/30 opacity-70"
          : "border-gray-100",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-main">
            <ReceiptLongIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-deep">{expense.title}</p>
            <p className="text-xs text-on-surface-variant">
              {new Date(expense.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {expense.settled && (
            <span className="rounded-full bg-income/10 px-2 py-0.5 text-[10px] font-semibold text-income">
              {UI_TEXT.SETTLED}
            </span>
          )}
          <ExpenseCardMenu
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleSettle={onToggleSettle}
            settled={Boolean(expense.settled)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Total</p>
          <p className="mt-0.5 text-sm font-bold text-brand-deep">
            {CURRENCY_SYMBOL}{formatCurrency(expense.amount)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Each</p>
          <p className="mt-0.5 text-sm font-semibold text-brand-deep">
            {CURRENCY_SYMBOL}{formatCurrency(share)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">{UI_TEXT.PAID_BY}</p>
          <p className="mt-0.5 text-sm font-semibold text-brand-deep">
            {payer?.id === youId ? "You" : (payer?.name ?? "—")}
          </p>
        </div>
      </div>

      <p className="mt-2 truncate text-xs text-on-surface-variant">
        Split between: {splitNames || "—"}
      </p>
    </article>
  );
}
