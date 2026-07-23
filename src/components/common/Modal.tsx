"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { MODAL, UI_TEXT } from "@constants";

import { CloseIcon } from "@components/icons";

import { cn } from "@utils/cn";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

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

export function Modal({ open, onClose, title, size = "md", padded = true, children, footer }: ModalProps) {
  const instanceId = useId();
  const [stackIndex, setStackIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [enterKey, setEnterKey] = useState(0);
  const wasOpenRef = useRef(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      openModalStack.push(instanceId);
      setStackIndex(openModalStack.length - 1);
    } else {
      const idx = openModalStack.indexOf(instanceId);
      if (idx >= 0) openModalStack.splice(idx, 1);
    }
  }

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      setExiting(false);
      setEnterKey((k) => k + 1);
      return undefined;
    }
    if (!wasOpenRef.current) return undefined;
    setExiting(true);
    const timeoutId = window.setTimeout(() => {
      setExiting(false);
      wasOpenRef.current = false;
    }, MODAL.EXIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  const visible = open || exiting;

  useEffect(() => {
    if (!visible) {
      if (openModalStack.length === 0) {
        document.body.style.overflow = "";
      }
      return undefined;
    }

    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!open) return;
      // Only the topmost modal closes; nested Add-category must not dismiss BudgetModal.
      if (openModalStack[openModalStack.length - 1] !== instanceId) return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [visible, open, onClose, instanceId]);

  useEffect(
    () => () => {
      const idx = openModalStack.indexOf(instanceId);
      if (idx >= 0) openModalStack.splice(idx, 1);
      if (openModalStack.length === 0) {
        document.body.style.overflow = "";
      }
    },
    [instanceId],
  );

  if (!visible || !mounted) return null;

  const zIndex = MODAL.BASE_Z + stackIndex * MODAL.Z_STEP;
  const hasTitle = title != null && title !== "";
  const isExiting = !open && exiting;

  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5" style={{ zIndex }}>
      <div
        key={`backdrop-${enterKey}`}
        className={cn("modal-backdrop absolute inset-0", isExiting && "modal-backdrop--exit")}
        onClick={open ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        key={`panel-${enterKey}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? `${instanceId}-title` : undefined}
        className={cn(
          "modal-panel relative flex max-h-[min(92vh,100dvh)] w-full flex-col overflow-hidden",
          "rounded-t-[1.25rem] bg-card sm:rounded-card",
          "pb-[env(safe-area-inset-bottom)] sm:pb-0",
          SIZE_CLASSES[size],
          isExiting && "modal-panel--exit",
        )}
      >
        {/* Mobile sheet affordance */}
        <div className="flex shrink-0 justify-center pt-2.5 pb-0.5 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-outline-variant/80" />
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-3 px-5",
            hasTitle
              ? "justify-between border-b border-outline-variant/50 py-3.5 sm:py-4"
              : "justify-end pt-1 pb-2 sm:pt-3 sm:pb-2",
          )}
        >
          {hasTitle ? (
            <h2
              id={`${instanceId}-title`}
              className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-brand-deep"
            >
              {title}
            </h2>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={!open}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-low hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:pointer-events-none"
            aria-label={UI_TEXT.CLOSE}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", padded ? "px-5 py-4" : "p-0")}>
          {children}
        </div>

        {footer ? (
          <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-outline-variant/50 bg-surface-low/50 px-5 py-3.5 sm:gap-3 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
