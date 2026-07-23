"use client";

import { BackspaceIcon } from "@components/icons";

import { cn } from "@utils/cn";

export interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  className?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export function NumericKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  className,
}: NumericKeypadProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {KEYS.map((key) => {
        if (key === "back") {
          return (
            <button
              key={key}
              type="button"
              onClick={onBackspace}
              className="flex h-14 items-center justify-center rounded-2xl bg-white text-brand-deep shadow-sm active:scale-95"
              aria-label="Backspace"
            >
              <BackspaceIcon className="h-5 w-5" />
            </button>
          );
        }
        if (key === ".") {
          return (
            <button
              key={key}
              type="button"
              onClick={onDecimal}
              className="flex h-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-brand-deep shadow-sm active:scale-95"
            >
              .
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onDigit(key)}
            className="flex h-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-brand-deep shadow-sm active:scale-95"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
