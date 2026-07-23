"use client";

import { useMemo, useState, type FormEvent } from "react";

import { v4 as uuidv4 } from "uuid";

import { CURRENCY_SYMBOL, NUMBER_FORMAT, UI_TEXT } from "@constants";

import { Button, ConfirmDialog, Field, Input, Modal, Select } from "@common";

import { AccountBalanceIcon, AddIcon, CreditCardIcon, DeleteIcon, EditIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useResetOnOpen } from "@hooks/useResetOnOpen";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addNetWorthItem, deleteNetWorthItem, updateNetWorthItem } from "@store/slices/netWorthSlice";
import { showError, showSuccess } from "@utils/toast";

import type { NetWorthItem, NetWorthKind } from "@/types";

const KIND_OPTIONS: { value: NetWorthKind; label: string }[] = [
  { value: "bank", label: UI_TEXT.NET_WORTH_KIND_BANK },
  { value: "cash", label: UI_TEXT.NET_WORTH_KIND_CASH },
  { value: "investment", label: UI_TEXT.NET_WORTH_KIND_INVESTMENT },
  { value: "property", label: UI_TEXT.NET_WORTH_KIND_PROPERTY },
  { value: "vehicle", label: UI_TEXT.NET_WORTH_KIND_VEHICLE },
  { value: "other_asset", label: UI_TEXT.NET_WORTH_KIND_OTHER },
];

interface NetWorthManageModalProps {
  open: boolean;
  onClose: () => void;
}

function AssetFormModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: NetWorthItem | null }) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<NetWorthKind>("bank");
  const [balance, setBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useResetOnOpen(open, item?.id, () => {
    setName(item?.name ?? "");
    setKind(item?.kind ?? "bank");
    setBalance(item != null ? String(item.balance) : "");
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!name.trim()) {
      showError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }
    const bal = Number(balance);
    if (!Number.isFinite(bal) || bal < 0) {
      showError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    setSubmitting(true);
    try {
      if (item) {
        await dispatch(
          updateNetWorthItem({
            id: item.id,
            userId,
            patch: { name: name.trim(), kind, balance: bal },
          }),
        ).unwrap();
        showSuccess(UI_TEXT.SUCCESS_NET_WORTH_UPDATED);
      } else {
        const created: NetWorthItem = {
          id: uuidv4(),
          userId,
          name: name.trim(),
          kind,
          balance: bal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dispatch(addNetWorthItem(created)).unwrap();
        showSuccess(UI_TEXT.SUCCESS_NET_WORTH_ADDED);
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
      title={item ? UI_TEXT.NET_WORTH_EDIT : UI_TEXT.NET_WORTH_ADD}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {UI_TEXT.CANCEL}
          </Button>
          <Button type="submit" form="net-worth-form" loading={submitting}>
            {UI_TEXT.SAVE}
          </Button>
        </>
      }
    >
      <form id="net-worth-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={UI_TEXT.NET_WORTH_NAME} required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Savings account" />
        </Field>
        <Field label={UI_TEXT.NET_WORTH_KIND}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as NetWorthKind)}>
            {KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={UI_TEXT.NET_WORTH_BALANCE} required>
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
      </form>
    </Modal>
  );
}

export function NetWorthManageModal({ open, onClose }: NetWorthManageModalProps) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.netWorth.items);
  const { formatCurrency } = useCurrencyFormatter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NetWorthItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NetWorthItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const total = useMemo(() => items.reduce((s, i) => s + (i.balance || 0), 0), [items]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dispatch(deleteNetWorthItem(pendingDelete.id)).unwrap();
      showSuccess(UI_TEXT.SUCCESS_NET_WORTH_DELETED);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={UI_TEXT.NET_WORTH_MANAGE}
        footer={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<AddIcon className="h-4 w-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {UI_TEXT.NET_WORTH_ADD}
          </Button>
        }
      >
        <p className="mb-3 text-sm text-on-surface-variant">
          {UI_TEXT.NET_WORTH_ASSETS}: {CURRENCY_SYMBOL}
          {formatCurrency(total)}
        </p>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-on-surface-variant">{UI_TEXT.NET_WORTH_EMPTY}</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-deep">{item.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {KIND_OPTIONS.find((k) => k.value === item.kind)?.label ?? item.kind} · {CURRENCY_SYMBOL}
                    {formatCurrency(item.balance)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-low"
                    aria-label={UI_TEXT.EDIT}
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-expense hover:bg-red-50"
                    aria-label={UI_TEXT.DELETE}
                    onClick={() => setPendingDelete(item)}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <AssetFormModal open={formOpen} onClose={() => setFormOpen(false)} item={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={UI_TEXT.NET_WORTH_DELETE_TITLE}
        message={UI_TEXT.NET_WORTH_CONFIRM_DELETE}
        confirmLabel={UI_TEXT.DELETE}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

interface NetWorthWidgetProps {
  assets: number;
  debt: number;
  onManage?: () => void;
}

export function NetWorthWidget({ assets, debt, onManage }: NetWorthWidgetProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const netWorth = assets - debt;

  return (
    <section className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-card md:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-on-surface-variant">{UI_TEXT.NET_WORTH}</h3>
        {onManage && (
          <button type="button" onClick={onManage} className="text-xs font-semibold text-primary-main hover:underline">
            {UI_TEXT.NET_WORTH_MANAGE}
          </button>
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${netWorth >= 0 ? "text-income" : "text-expense"}`}>
        ₹{formatCurrency(netWorth)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-xl bg-income-soft/50 px-3 py-2">
          <AccountBalanceIcon className="h-4 w-4 text-income" />
          <div>
            <p className="text-on-surface-variant">{UI_TEXT.NET_WORTH_ASSETS}</p>
            <p className="font-semibold text-brand-deep">₹{formatCurrency(assets)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-expense-soft/50 px-3 py-2">
          <CreditCardIcon className="h-4 w-4 text-expense" />
          <div>
            <p className="text-on-surface-variant">{UI_TEXT.NET_WORTH_DEBT}</p>
            <p className="font-semibold text-brand-deep">₹{formatCurrency(debt)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
