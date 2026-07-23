"use client";

import { UI_TEXT } from "@constants";

import { cn } from "@utils/cn";

export type ImportStep = 1 | 2 | 3;

const STEPS: { step: ImportStep; label: string }[] = [
  { step: 1, label: UI_TEXT.IMPORT_STEP_UPLOAD },
  { step: 2, label: UI_TEXT.IMPORT_STEP_REVIEW },
  { step: 3, label: UI_TEXT.IMPORT_STEP_FINISH },
];

export interface ImportStepperProps {
  activeStep: ImportStep;
  className?: string;
}

export function ImportStepper({ activeStep, className }: ImportStepperProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6",
        className,
      )}
      role="list"
      aria-label="Import progress"
    >
      {STEPS.map(({ step, label }) => {
        const active = step === activeStep;
        const complete = step < activeStep;
        const emphasized = active || complete;

        return (
          <div key={step} className="flex flex-col gap-2" role="listitem">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  emphasized
                    ? "bg-primary-main text-white"
                    : "bg-surface-container text-gray-500",
                )}
              >
                {step}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  emphasized ? "text-primary-main" : "text-gray-400",
                )}
              >
                {label}
              </span>
            </div>
            <div
              className={cn(
                "h-1.5 w-full overflow-hidden rounded-full bg-surface-container",
                active && "bg-primary-main",
                complete && "bg-primary-main",
              )}
            >
              {step === activeStep + 1 ? (
                <div className="h-full w-1/3 rounded-full bg-primary-main/40" />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
