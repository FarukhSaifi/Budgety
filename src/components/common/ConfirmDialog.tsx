"use client";

import { UI_TEXT } from "@constants";

import { Button } from "@components/common/Button";
import { Modal } from "@components/common/Modal";
import { WarningIcon } from "@components/icons";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = UI_TEXT.CONFIRM_ACTION,
  message = UI_TEXT.CONFIRM_DEFAULT_MESSAGE,
  confirmLabel = UI_TEXT.CONFIRM,
  cancelLabel = UI_TEXT.CANCEL,
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-expense-soft text-expense">
          <WarningIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-brand-deep">{title}</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
