"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import { PRIMARY_PAYMENT_MODES, UI_TEXT } from "@constants";

import { Badge, Button, CategoryPicker, ConfirmDialog, EmptyState, Field, Input, Modal, Select } from "@common";

import { AddIcon, AutoAwesomeIcon, DeleteIcon, EditIcon, MoreVertIcon, PlayArrowIcon, TuneIcon } from "@components/icons";

import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addRule, deleteRule, fetchRules, updateRule } from "@store/slices/rulesSlice";
import { applyRulesToTransactions } from "@store/slices/transactionsSlice";
import { cn } from "@utils/cn";
import { showError, showSuccess } from "@utils/toast";

import type { CategorizationRule, PaymentMode } from "@/types";

function needlesFromInput(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function needlesDisplay(rule: CategorizationRule): string[] {
  const list = (rule.matchContainsAny ?? []).map((s) => s.trim()).filter(Boolean);
  if (list.length > 0) return list;
  const single = String(rule.matchContains ?? "").trim();
  return single ? [single] : [];
}

function formatNeedlesPreview(needles: string[]): string {
  if (needles.length === 0) return "…";
  return needles.map((n) => `“${n}”`).join(", ");
}

// ---------------------------------------------------------------------------
// Rule card context menu
// ---------------------------------------------------------------------------

function RuleCardMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  rule?: CategorizationRule | null;
}

function RuleModal({ open, onClose, rule }: RuleModalProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);

  const [name, setName] = useState("");
  const [matchInput, setMatchInput] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState<"" | PaymentMode>("");
  const [transactionType, setTransactionType] = useState<"any" | "income" | "expense">("any");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, rule?.id, () => {
    setName(rule?.name ?? "");
    setMatchInput(needlesDisplay(rule ?? ({ matchContains: "" } as CategorizationRule)).join(", "));
    setCategory(rule?.category ?? "");
    setPaymentMode((rule?.paymentMode as PaymentMode | undefined) ?? "");
    setTransactionType((rule?.transactionType as "any" | "income" | "expense") ?? "any");
    setIsActive(rule?.isActive ?? true);
  });

  const needles = useMemo(() => needlesFromInput(matchInput), [matchInput]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!name.trim() || needles.length === 0 || !category) {
      import("@utils/toast").then(({ showError }) => showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS));
      return;
    }

    const matchContains = needles[0];
    const matchContainsAny = needles;
    const modePatch = paymentMode || undefined;

    setSubmitting(true);
    try {
      if (rule) {
        await dispatch(
          updateRule({
            id: rule.id,
            userId,
            patch: {
              name: name.trim(),
              matchContains,
              matchContainsAny,
              category,
              paymentMode: modePatch,
              transactionType,
              isActive,
            },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_RULE_UPDATED);
      } else {
        const newRule: CategorizationRule = {
          id: uuidv4(),
          userId,
          name: name.trim(),
          matchContains,
          matchContainsAny,
          category,
          ...(modePatch ? { paymentMode: modePatch } : {}),
          transactionType,
          isActive,
          createdAt: new Date().toISOString(),
        };
        await dispatch(addRule(newRule)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_RULE_ADDED);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const pickerType = transactionType === "income" ? "income" : "expense";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rule ? UI_TEXT.EDIT_RULE : UI_TEXT.ADD_RULE}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="rule-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="rule-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.RULE_NAME} required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Swiggy → Dining Out" />
        </Field>

        <Field label={UI_TEXT.RULE_TRANSACTION_TYPE}>
          <Select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as "any" | "income" | "expense")}
          >
            <option value="any">{UI_TEXT.RULE_TYPE_ANY}</option>
            <option value="income">{UI_TEXT.RULE_TYPE_INCOME}</option>
            <option value="expense">{UI_TEXT.RULE_TYPE_EXPENSE}</option>
          </Select>
        </Field>

        <Field label={UI_TEXT.RULE_MATCH_CONTAINS_ANY} required>
          <Input
            value={matchInput}
            onChange={(e) => setMatchInput(e.target.value)}
            placeholder={UI_TEXT.RULE_MATCH_HINT}
          />
          <p className="text-xs text-on-surface-variant">{UI_TEXT.RULE_MATCH_HINT}</p>
        </Field>

        <Field label={UI_TEXT.RULE_CATEGORY} required>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            type={pickerType}
            showAiSuggest={false}
            placeholder="Select category"
          />
        </Field>

        <Field label={UI_TEXT.RULE_PAYMENT_MODE}>
          <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as "" | PaymentMode)}>
            <option value="">{UI_TEXT.RULE_PAYMENT_MODE_NONE}</option>
            {PRIMARY_PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl bg-surface-low/70 px-3.5 py-2.5 text-sm">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {UI_TEXT.RULE_PREVIEW}
          </p>
          <p>
            <span className="text-on-surface-variant">
              {needles.length > 1 ? UI_TEXT.RULE_PREVIEW_CONTAINS_ANY : UI_TEXT.RULE_PREVIEW_CONTAINS}{" "}
            </span>
            <span className="font-mono font-semibold text-primary-main">{formatNeedlesPreview(needles)}</span>
            <span className="text-on-surface-variant"> {UI_TEXT.RULE_PREVIEW_THEN} </span>
            <span className="font-semibold text-brand-deep">{category || "…"}</span>
            {paymentMode ? (
              <>
                <span className="text-on-surface-variant"> {UI_TEXT.RULE_PREVIEW_AND_MODE} </span>
                <span className="font-semibold text-brand-deep">{paymentMode}</span>
              </>
            ) : null}
          </p>
        </div>

        <Field label={UI_TEXT.RULE_IS_ACTIVE}>
          <label className="flex cursor-pointer items-center gap-2.5">
            <div
              role="switch"
              aria-checked={isActive}
              tabIndex={0}
              onClick={() => setIsActive((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setIsActive((v) => !v);
                }
              }}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main/40",
                isActive ? "bg-primary-main" : "bg-outline-variant",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  isActive ? "translate-x-6" : "translate-x-1",
                )}
              />
            </div>
            <span className="text-sm text-brand-deep">{isActive ? UI_TEXT.RULE_IS_ACTIVE : UI_TEXT.RULE_INACTIVE}</span>
          </label>
        </Field>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function RulesScreen() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const { items: rules, status } = useAppSelector((s) => s.rules);
  const applyingRules = useAppSelector((s) => s.transactions.applyingRules);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategorizationRule | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CategorizationRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningRuleId, setRunningRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (userId && status === "idle") {
      void dispatch(fetchRules(userId));
    }
  }, [dispatch, userId, status]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (r: CategorizationRule) => {
    setEditing(r);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteRule(pendingDelete.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_RULE_DELETED);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = rules.filter((r) => r.isActive).length;

  const runRules = async (rulesToRun: CategorizationRule[]) => {
    if (!userId) return;
    try {
      const result = await dispatch(applyRulesToTransactions({ userId, rules: rulesToRun })).unwrap();
      if (result.updatedCount > 0) {
        const template = rulesToRun.length === 1 ? UI_TEXT.APPLY_RULE_SUCCESS : UI_TEXT.APPLY_RULES_SUCCESS;
        showSuccess(template.replace("{count}", String(result.updatedCount)));
      } else {
        showSuccess(rulesToRun.length === 1 ? UI_TEXT.APPLY_RULE_NONE : UI_TEXT.APPLY_RULES_NONE);
      }
    } catch {
      showError(UI_TEXT.AUTH_GENERIC_ERROR);
    }
  };

  const handleApplyAllRules = async () => {
    if (activeCount === 0) {
      showError(UI_TEXT.APPLY_RULES_NO_ACTIVE);
      return;
    }
    await runRules(rules);
  };

  const handleRunRule = async (rule: CategorizationRule) => {
    if (!rule.isActive) {
      showError(UI_TEXT.APPLY_RULE_INACTIVE);
      return;
    }
    setRunningRuleId(rule.id);
    try {
      await runRules([rule]);
    } finally {
      setRunningRuleId(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:max-w-2xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-deep">{UI_TEXT.RULES_TITLE}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{UI_TEXT.RULES_SUBTITLE}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<AddIcon className="h-4 w-4" />} onClick={openAdd}>
          {UI_TEXT.ADD_RULE}
        </Button>
      </header>

      {rules.length > 0 && (
        <div className="space-y-3 rounded-card border border-primary-soft/40 bg-primary-soft/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <AutoAwesomeIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-main" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-brand-deep">{activeCount}</span> active{" "}
                {activeCount === 1 ? "rule" : "rules"} — new imports and transactions are auto-categorized.
              </p>
              <p className="text-xs text-on-surface-variant">{UI_TEXT.RULES_APPLY_HINT}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<PlayArrowIcon className="h-4 w-4" />}
            loading={applyingRules && !runningRuleId}
            disabled={applyingRules || activeCount === 0}
            onClick={() => void handleApplyAllRules()}
          >
            {applyingRules && !runningRuleId ? UI_TEXT.APPLY_RULES_RUNNING : UI_TEXT.APPLY_RULES_TO_EXISTING}
          </Button>
        </div>
      )}

      <section className="space-y-3">
        {rules.length === 0 ? (
          <EmptyState
            icon={<TuneIcon className="h-6 w-6" />}
            title={UI_TEXT.NO_RULES}
            description={UI_TEXT.NO_RULES_HINT}
            action={
              <Button variant="primary" size="sm" leftIcon={<AddIcon className="h-4 w-4" />} onClick={openAdd}>
                {UI_TEXT.ADD_RULE}
              </Button>
            }
          />
        ) : (
          rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              running={runningRuleId === rule.id}
              applyDisabled={applyingRules}
              onRun={() => void handleRunRule(rule)}
              onEdit={() => openEdit(rule)}
              onDelete={() => setPendingDelete(rule)}
            />
          ))
        )}

        {rules.length > 0 && (
          <button
            type="button"
            onClick={openAdd}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary-soft bg-surface/60 px-4 py-6 text-primary-main transition-colors hover:border-primary-main/40 hover:bg-primary-soft/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-soft bg-white shadow-card">
              <AddIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">{UI_TEXT.ADD_RULE}</span>
          </button>
        )}
      </section>

      <RuleModal open={modalOpen} onClose={() => setModalOpen(false)} rule={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={UI_TEXT.DELETE_RULE_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_RULE}
        confirmLabel={UI_TEXT.DELETE}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rule card
// ---------------------------------------------------------------------------

function RuleCard({
  rule,
  running,
  applyDisabled,
  onRun,
  onEdit,
  onDelete,
}: {
  rule: CategorizationRule;
  running: boolean;
  applyDisabled: boolean;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeLabels: Record<string, string> = {
    any: UI_TEXT.RULE_TYPE_ANY,
    income: UI_TEXT.RULE_TYPE_INCOME,
    expense: UI_TEXT.RULE_TYPE_EXPENSE,
  };
  const needles = needlesDisplay(rule);
  const canRun = rule.isActive && !applyDisabled;

  return (
    <article
      className={cn(
        "rounded-card border bg-card p-4 shadow-card",
        rule.isActive ? "border-gray-100" : "border-outline-variant/30 opacity-60",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-main">
            <TuneIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-deep">{rule.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <Badge tone={rule.isActive ? "success" : "neutral"}>
                {rule.isActive ? UI_TEXT.RULE_IS_ACTIVE : UI_TEXT.RULE_INACTIVE}
              </Badge>
              {rule.transactionType && rule.transactionType !== "any" && (
                <Badge tone="info">{typeLabels[rule.transactionType]}</Badge>
              )}
              {rule.paymentMode ? <Badge tone="neutral">{rule.paymentMode}</Badge> : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<PlayArrowIcon className="h-4 w-4" />}
            loading={running}
            disabled={!canRun && !running}
            title={rule.isActive ? UI_TEXT.APPLY_RULE_ARIA : UI_TEXT.APPLY_RULE_INACTIVE}
            aria-label={UI_TEXT.APPLY_RULE_ARIA}
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
          >
            {running ? UI_TEXT.APPLY_RULE_RUNNING : UI_TEXT.APPLY_RULE}
          </Button>
          <RuleCardMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface-low/70 px-3.5 py-2.5 text-sm">
        <span className="text-on-surface-variant">
          {needles.length > 1 ? UI_TEXT.RULE_PREVIEW_CONTAINS_ANY : UI_TEXT.RULE_PREVIEW_CONTAINS}{" "}
        </span>
        <span className="font-mono font-semibold text-primary-main">{formatNeedlesPreview(needles)}</span>
        <span className="text-on-surface-variant"> {UI_TEXT.RULE_PREVIEW_THEN} </span>
        <span className="font-semibold text-brand-deep">{rule.category}</span>
        {rule.paymentMode ? (
          <>
            <span className="text-on-surface-variant"> {UI_TEXT.RULE_PREVIEW_AND_MODE} </span>
            <span className="font-semibold text-brand-deep">{rule.paymentMode}</span>
          </>
        ) : null}
      </div>
    </article>
  );
}
