"use client";

import { cn } from "@utils/cn";
import { CloseIcon, HelpOutlineIcon, WarningIcon } from "@components/icons";
import type { ReactNode } from "react";

export interface AlertBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  tone?: "info" | "warning" | "budget";
  className?: string;
  icon?: ReactNode;
}

export function AlertBanner({
  title,
  message,
  onDismiss,
  tone = "info",
  className,
  icon,
}: AlertBannerProps) {
  const tones = {
    info: "bg-[#EEF0FF] text-brand-deep",
    warning: "bg-amber-50 text-amber-900",
    budget: "bg-[#F3E8FF] text-brand-deep",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-3.5 py-3",
        tones[tone],
        className,
      )}
      role="status"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-main/15 text-primary-main">
        {icon ??
          (tone === "warning" ? (
            <WarningIcon className="h-4 w-4" />
          ) : (
            <HelpOutlineIcon className="h-4 w-4" />
          ))}
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <p className={cn("text-sm leading-snug", title ? "text-gray-600" : "font-medium")}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
