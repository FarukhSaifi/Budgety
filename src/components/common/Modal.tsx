"use client";

import { cn } from "@utils/cn";
import { CloseIcon } from "@components/icons";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

/** Base overlay z-index (above sidebar/bottom nav at 1000). Nested modals stack above. */
const MODAL_BASE_Z = 1100;
const MODAL_Z_STEP = 10;

/** LIFO stack of open modal instance ids so only the topmost handles Escape / body lock. */
const openModalStack: string[] = [];

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  /** When false, content area has no default padding (for full-bleed screens). */
  padded?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  padded = true,
  children,
  footer,
}: ModalProps) {
  const instanceId = useId();
  const [stackIndex, setStackIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    openModalStack.push(instanceId);
    setStackIndex(openModalStack.length - 1);
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Only the topmost modal closes; nested Add-category must not dismiss BudgetModal.
      if (openModalStack[openModalStack.length - 1] !== instanceId) return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      const idx = openModalStack.indexOf(instanceId);
      if (idx >= 0) openModalStack.splice(idx, 1);
      document.removeEventListener("keydown", onKey);
      if (openModalStack.length === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [open, onClose, instanceId]);

  if (!open || !mounted) return null;

  const zIndex = MODAL_BASE_Z + stackIndex * MODAL_Z_STEP;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[min(92vh,100dvh)] w-full flex-col overflow-hidden rounded-t-card bg-white shadow-elevated sm:rounded-card",
          SIZE_CLASSES[size],
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title ?? ""}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            padded ? "px-5 py-4" : "p-0",
          )}
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
