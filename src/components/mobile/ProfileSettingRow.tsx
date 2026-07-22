"use client";

import { cn } from "@utils/cn";
import { ChevronRightIcon } from "@components/icons";
import type { IconComponent } from "@components/icons";
import type { ReactNode } from "react";

export interface ProfileSettingRowProps {
  icon: IconComponent;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}

export function ProfileSettingRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  onClick,
  className,
  danger,
}: ProfileSettingRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-gray-100 py-3.5 text-left last:border-b-0",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          danger ? "bg-rose-50 text-expense" : "bg-surface-low text-brand-deep",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-semibold",
              danger ? "text-expense" : "text-brand-deep",
            )}
          >
            {title}
          </p>
          {badge}
        </div>
        {subtitle && <p className="truncate text-xs text-gray-400">{subtitle}</p>}
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-300" />
    </button>
  );
}
