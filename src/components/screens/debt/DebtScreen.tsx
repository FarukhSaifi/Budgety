"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import { CURRENCY_SYMBOL, NUMBER_FORMAT, UI_TEXT } from "@constants";

import { Button, ConfirmDialog, EmptyState, Field, Input, Modal, Select } from "@common";

import {
  AccountBalanceIcon,
  AddIcon,
  CreditCardIcon,
  DeleteIcon,
  EditIcon,
  MoreVertIcon,
  PaymentsIcon,
  TrendingDownIcon,
} from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  addDebt,
  deleteDebt,
  fetchDebts,
  setDebtStrategy,
  updateDebt,
} from "@store/slices/debtSlice";
import { cn } from "@utils/cn";
import {
  estimateMonthsToPayoff,
  formatDebtFreeDate,
  comparePayoffStrategies,
  sortDebts,
} from "@utils/debtPayoff";
import { showError, showSuccess } from "@utils/toast";

import type { Debt, DebtKind, DebtStrategy } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kindLabel(kind: DebtKind): string {
  switch (kind) {
    case "credit_card":
      return "Credit Card";
    case "loan":
      return "Loan";
    default:
      return "Other";
  }
}

function kindIcon(kind: DebtKind) {
  const cls = "h-5 w-5";
  if (kind === "credit_card") return <CreditCardIcon className={cls} />;
  if (kind === "loan") return <AccountBalanceIcon className={cls} />;
  return <PaymentsIcon className={cls} />;
}

// ---------------------------------------------------------------------------
// Card context menu
// ---------------------------------------------------------------------------

function DebtCardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
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
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-elevated">
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
// Add / Edit modal
// ---------------------------------------------------------------------------

interface DebtModalProps {
  open: boolean;
  onClose: () => void;
  debt?: Debt | null;
}

function DebtModal({ open, onClose, debt }: DebtModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DebtKind>("loan");
  const [principal, setPrincipal] = useState("");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, debt?.id, () => {
    setTitle(debt?.title ?? "");
    setKind(debt?.kind ?? "loan");
    setPrincipal(debt ? String(debt.principal) : "");
    setBalance(debt ? String(debt.balance) : "");
    setInterestRate(debt ? String(debt.interestRate) : "");
    setMinimumPayment(debt ? String(debt.minimumPayment) : "");
    setDueDay(debt?.dueDay != null ? String(debt.dueDay) : "");
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!title.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    const bal = Number(balance);
    const prin = Number(principal) || bal;
    const rate = Number(interestRate);
    const minPay = Number(minimumPayment);
    if (bal < 0 || rate < 0 || minPay < 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    setSubmitting(true);
    try {
      if (debt) {
        await dispatch(
          updateDebt({
            id: debt.id,
            userId,
            patch: {
              title: title.trim(),
              kind,
              principal: prin,
              balance: bal,
              interestRate: rate,
              minimumPayment: minPay,
              dueDay: dueDay ? Number(dueDay) : undefined,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_DEBT_UPDATED);
      } else {
        const newDebt: Debt = {
          id: uuidv4(),
          userId,
          title: title.trim(),
          kind,
          principal: prin,
          balance: bal,
          interestRate: rate,
          minimumPayment: minPay,
          dueDay: dueDay ? Number(dueDay) : undefined,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addDebt(newDebt)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_DEBT_ADDED);
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
      title={debt ? UI_TEXT.EDIT_DEBT : UI_TEXT.ADD_DEBT}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="debt-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="debt-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.DEBT_TITLE} required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Home Loan"
          />
        </Field>

        <Field label={UI_TEXT.DEBT_KIND} required>
          <Select value={kind} onChange={(e) => setKind(e.target.value as DebtKind)}>
            <option value="loan">Loan</option>
            <option value="credit_card">Credit Card</option>
            <option value="other">Other</option>
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.DEBT_PRINCIPAL}>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label={UI_TEXT.DEBT_BALANCE} required>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={UI_TEXT.DEBT_INTEREST_RATE} required>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={100}
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="e.g., 12.5"
            />
          </Field>
          <Field label={UI_TEXT.DEBT_MINIMUM_PAYMENT} required>
            <Input
              type="number"
              inputMode="decimal"
              step={NUMBER_FORMAT.STEP_VALUE}
              min={0}
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>

        <Field label={UI_TEXT.DEBT_DUE_DAY}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="e.g., 15"
          />
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Strategy toggle
// ---------------------------------------------------------------------------

function StrategyToggle({
  value,
  onChange,
}: {
  value: DebtStrategy;
  onChange: (s: DebtStrategy) => void;
}) {
  return (
    <div className="rounded-card border border-outline-variant/50 bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-brand-deep">{UI_TEXT.PAYOFF_STRATEGY}</p>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-low p-1">
        {(
          [
            ["snowball", UI_TEXT.STRATEGY_SNOWBALL, UI_TEXT.STRATEGY_SNOWBALL_HINT],
            ["avalanche", UI_TEXT.STRATEGY_AVALANCHE, UI_TEXT.STRATEGY_AVALANCHE_HINT],
          ] as const
        ).map(([s, label, hint]) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-left transition-colors",
              value === s
                ? "bg-white shadow-card"
                : "hover:bg-white/50",
            )}
          >
            <p
              className={cn(
                "text-sm font-semibold",
                value === s ? "text-primary-main" : "text-on-surface-variant",
              )}
            >
              {label}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payoff calculator
// ---------------------------------------------------------------------------

function PayoffCalculator({
  debts,
  strategy,
}: {
  debts: Debt[];
  strategy: DebtStrategy;
}) {
  const { formatCurrency } = useCurrencyFormatter();
  const [extra, setExtra] = useState("0");

  const extraNum = Math.max(0, Number(extra) || 0);
  const months = estimateMonthsToPayoff(debts, strategy, extraNum);
  const comparison = comparePayoffStrategies(debts, extraNum);
  const dateStr = formatDebtFreeDate(months, UI_TEXT.DEBT_INFINITY_HINT);
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const ordered = sortDebts(debts, strategy);
  const finite = Number.isFinite(months);

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-primary-soft/40 bg-card p-4 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDownIcon className="h-5 w-5 text-primary-main" />
          <p className="text-sm font-semibold text-brand-deep">{UI_TEXT.PAYOFF_CALCULATOR}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-low p-3">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
              {UI_TEXT.TOTAL_DEBT}
            </p>
            <p className="mt-1 text-lg font-bold text-expense">
              {CURRENCY_SYMBOL}{formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-low p-3">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
              {UI_TEXT.MONTHS_TO_PAYOFF}
            </p>
            <p className="mt-1 text-lg font-bold text-brand-deep">
              {finite ? months : "—"}
            </p>
          </div>
        </div>

        <Field label={UI_TEXT.EXTRA_MONTHLY_PAYMENT}>
          <Input
            type="number"
            inputMode="decimal"
            step={NUMBER_FORMAT.STEP_VALUE}
            min={0}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="0.00"
          />
        </Field>

        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3",
            finite ? "bg-primary-soft/40" : "bg-amber-50 dark:bg-amber-500/10",
          )}
        >
          <p className="text-xs font-medium text-on-surface-variant">{UI_TEXT.ESTIMATED_DEBT_FREE}</p>
          <p
            className={cn(
              "mt-0.5 text-base font-bold",
              finite ? "text-income" : "text-amber-900 dark:text-amber-100",
            )}
          >
            {finite ? dateStr : UI_TEXT.DEBT_INFINITY_HINT}
          </p>
        </div>
      </div>

      <div className="rounded-card border border-gray-100 bg-card p-4 shadow-card">
        <p className="text-sm font-semibold text-brand-deep">{UI_TEXT.STRATEGY_COMPARE_TITLE}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{UI_TEXT.STRATEGY_COMPARE_SUBTITLE}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              {
                key: "snowball" as const,
                label: UI_TEXT.STRATEGY_SNOWBALL,
                months: comparison.snowballMonths,
              },
              {
                key: "avalanche" as const,
                label: UI_TEXT.STRATEGY_AVALANCHE,
                months: comparison.avalancheMonths,
              },
            ] as const
          ).map((col) => {
            const colFinite = Number.isFinite(col.months);
            const active = strategy === col.key;
            return (
              <div
                key={col.key}
                className={cn(
                  "rounded-xl border p-3",
                  active ? "border-primary-main/40 bg-primary-soft/30" : "border-gray-100 bg-surface-low/60",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {col.label}
                </p>
                <p className="mt-1 text-lg font-bold text-brand-deep">
                  {colFinite ? `${col.months} mo` : "—"}
                </p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {colFinite
                    ? formatDebtFreeDate(col.months)
                    : UI_TEXT.DEBT_INFINITY_HINT}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-card border border-gray-100 bg-card p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold text-brand-deep">{UI_TEXT.PAYOFF_ORDER}</p>
        <ol className="space-y-2">
          {ordered.map((d, idx) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl bg-surface-low/70 px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-main">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-deep">{d.title}</p>
                <p className="text-xs text-on-surface-variant">
                  {CURRENCY_SYMBOL}
                  {formatCurrency(d.balance)} · {d.interestRate}%
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function DebtScreen() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const { items: debts, strategy, status } = useAppSelector((s) => s.debt);
  const { formatCurrency } = useCurrencyFormatter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId && status === "idle") {
      void dispatch(fetchDebts(userId));
    }
  }, [dispatch, userId, status]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (d: Debt) => {
    setEditing(d);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteDebt(pendingDelete.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_DEBT_DELETED);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleStrategyChange = (s: DebtStrategy) => {
    dispatch(setDebtStrategy(s));
  };

  const sorted = sortDebts(debts, strategy);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:max-w-2xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-deep">
            {UI_TEXT.DEBT_TRACKER}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{UI_TEXT.DEBT_TRACKER_SUBTITLE}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<AddIcon className="h-4 w-4" />}
          onClick={openAdd}
        >
          {UI_TEXT.ADD_DEBT}
        </Button>
      </header>

      {debts.length > 0 && (
        <>
          <StrategyToggle value={strategy} onChange={handleStrategyChange} />
          <PayoffCalculator debts={debts} strategy={strategy} />
        </>
      )}

      <section className="space-y-3">
        {debts.length === 0 ? (
          <EmptyState
            icon={<AccountBalanceIcon className="h-6 w-6" />}
            title={UI_TEXT.NO_DEBTS}
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<AddIcon className="h-4 w-4" />}
                onClick={openAdd}
              >
                {UI_TEXT.ADD_DEBT}
              </Button>
            }
          />
        ) : (
          sorted.map((debt) => {
            const progressPct =
              debt.principal > 0
                ? Math.max(0, Math.min(100, ((debt.principal - debt.balance) / debt.principal) * 100))
                : 0;

            return (
              <article
                key={debt.id}
                className="rounded-card border border-gray-100 bg-card p-4 shadow-card"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-main">
                      {kindIcon(debt.kind)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-deep">{debt.title}</p>
                      <p className="text-xs text-on-surface-variant">{kindLabel(debt.kind)}</p>
                    </div>
                  </div>
                  <DebtCardMenu
                    onEdit={() => openEdit(debt)}
                    onDelete={() => setPendingDelete(debt)}
                  />
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
                      {UI_TEXT.DEBT_BALANCE}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-expense">
                      {CURRENCY_SYMBOL}{formatCurrency(debt.balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
                      {UI_TEXT.DEBT_INTEREST_RATE}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-brand-deep">
                      {debt.interestRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
                      Min Payment
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-brand-deep">
                      {CURRENCY_SYMBOL}{formatCurrency(debt.minimumPayment)}
                    </p>
                  </div>
                </div>

                {debt.principal > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Paid off</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-low">
                      <div
                        className="h-full rounded-full bg-income transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {debt.dueDay != null && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {UI_TEXT.DUE} {debt.dueDay} of every month
                  </p>
                )}
              </article>
            );
          })
        )}

        {debts.length > 0 && (
          <button
            type="button"
            onClick={openAdd}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary-soft bg-surface/60 px-4 py-6 text-primary-main transition-colors hover:border-primary-main/40 hover:bg-primary-soft/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-soft bg-white shadow-card">
              <AddIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">{UI_TEXT.ADD_DEBT}</span>
          </button>
        )}
      </section>

      <DebtModal open={modalOpen} onClose={() => setModalOpen(false)} debt={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={UI_TEXT.DELETE_DEBT_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_DEBT}
        confirmLabel={UI_TEXT.DELETE}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
