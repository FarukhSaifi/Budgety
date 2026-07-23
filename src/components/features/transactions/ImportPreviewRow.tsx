"use client";

import { memo } from "react";

import {
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";

import { CategoryPicker, Input, Select } from "@common";

import { CheckCircleIcon, WarningIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { cn } from "@utils/cn";
import { parseDate } from "@utils/dateUtils";
import type { DuplicateReason } from "@utils/duplicateDetection";
import { stagingRowNeedsReview, type StagingRow } from "@utils/importHelpers";

import type { TransactionType } from "@/types";

export interface ImportPreviewRowProps {
  row: StagingRow;
  isDuplicate: boolean;
  duplicateReason?: DuplicateReason | null;
  variant: "table" | "card";
  onToggle: (key: string, selected: boolean) => void;
  onCategoryChange: (key: string, category: string) => void;
  onFieldChange: (key: string, patch: Partial<StagingRow>) => void;
}

function formatPreviewDate(date: string): string {
  const d = parseDate(date);
  if (!d) return date || "";
  return d.format("MMM D, YYYY");
}

function duplicateReasonLabel(reason?: DuplicateReason | null): string {
  if (reason === "exists_in_database") return UI_TEXT.IMPORT_DUPLICATE_IN_ACCOUNT;
  if (reason === "duplicate_in_batch") return UI_TEXT.IMPORT_DUPLICATE_IN_FILE;
  return UI_TEXT.IMPORT_DUPLICATE_BADGE;
}

function ImportPreviewRowInner({
  row,
  isDuplicate,
  duplicateReason,
  variant,
  onToggle,
  onCategoryChange,
  onFieldChange,
}: ImportPreviewRowProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const isIncome = row.type === TRANSACTION_TYPES.INCOME;
  const needsFieldsReview = stagingRowNeedsReview(row, false);
  const review = needsFieldsReview || isDuplicate;
  const prettyDate = formatPreviewDate(row.date);
  const titleHint = String(row.title || "").trim();
  const showAi =
    Boolean(titleHint) &&
    (needsFieldsReview ||
      !row.category ||
      row.category === EXPENSE_CATEGORIES.OTHER ||
      row.category === INCOME_CATEGORIES.OTHER);

  const amountLabel = `${isIncome ? UI_TEXT.INCOME_SYMBOL : UI_TEXT.EXPENSE_SYMBOL}${CURRENCY_SYMBOL}${formatCurrency(
    Math.abs(row.amount),
    {
      minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
      maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
    },
  )}`;

  const subtitle = isDuplicate
    ? duplicateReasonLabel(duplicateReason)
    : !row.category || !titleHint
      ? UI_TEXT.IMPORT_MISSING_REFERENCE
      : row.paymentMode || (isIncome ? UI_TEXT.INCOME : UI_TEXT.EXPENSE);

  const statusBadge = isDuplicate ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
      <WarningIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_DUPLICATE}
    </span>
  ) : needsFieldsReview ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
      <WarningIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_REVIEW}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-income dark:bg-income/10">
      <CheckCircleIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_VALID}
    </span>
  );

  const categorySelect = (
    <CategoryPicker
      value={row.category || ""}
      onChange={(category) => onCategoryChange(row.key, category)}
      type={row.type}
      titleHint={titleHint}
      amountHint={Number(row.amount) || undefined}
      showAiSuggest={showAi}
      compact
      placeholder={UI_TEXT.IMPORT_SELECT_CATEGORY}
    />
  );

  const titleInput = (
    <Input
      value={row.title}
      onChange={(e) => onFieldChange(row.key, { title: e.target.value })}
      aria-label={UI_TEXT.IMPORT_EDIT_TITLE}
      className="!py-1.5 text-sm"
      placeholder={UI_TEXT.NO_DESCRIPTION}
    />
  );

  const dateInput = (
    <Input
      type="date"
      value={row.date?.slice(0, 10) || ""}
      onChange={(e) => onFieldChange(row.key, { date: e.target.value })}
      aria-label={UI_TEXT.IMPORT_EDIT_DATE}
      className="!py-1.5 text-sm tabular-nums"
    />
  );

  const amountInput = (
    <Input
      type="number"
      inputMode="decimal"
      step={NUMBER_FORMAT.STEP_VALUE}
      min={0}
      value={Number.isFinite(row.amount) ? row.amount : ""}
      onChange={(e) => onFieldChange(row.key, { amount: Math.abs(Number(e.target.value) || 0) })}
      aria-label={UI_TEXT.IMPORT_EDIT_AMOUNT}
      className="!py-1.5 text-sm tabular-nums"
    />
  );

  const typeSelect = (
    <Select
      value={row.type}
      onChange={(e) => onFieldChange(row.key, { type: e.target.value as TransactionType })}
      aria-label={UI_TEXT.IMPORT_EDIT_TYPE}
      className="!py-1.5 text-xs"
    >
      <option value={TRANSACTION_TYPES.EXPENSE}>{UI_TEXT.EXPENSE}</option>
      <option value={TRANSACTION_TYPES.INCOME}>{UI_TEXT.INCOME}</option>
    </Select>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border p-3 md:p-4",
          isDuplicate
            ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/10"
            : needsFieldsReview
              ? "border-amber-200/80 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-500/5"
              : row.selected
                ? "border-primary-main/20 bg-white dark:bg-card"
                : "border-gray-200 bg-gray-50 dark:border-outline-variant dark:bg-surface-low",
          !row.selected && "opacity-70",
        )}
      >
        <div className="mb-3 flex items-start gap-3">
          <input
            type="checkbox"
            checked={row.selected}
            onChange={(e) => onToggle(row.key, e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
            aria-label={`Select ${titleHint || UI_TEXT.NO_DESCRIPTION}`}
          />
          <div className="min-w-0 flex-1 space-y-2">
            {dateInput}
            {titleInput}
            <div className="grid grid-cols-2 gap-2">
              {amountInput}
              {typeSelect}
            </div>
            <p
              className={cn(
                "text-xs font-medium",
                isDuplicate
                  ? "text-amber-800 dark:text-amber-200"
                  : review && !row.category
                    ? "text-amber-800 dark:text-amber-200"
                    : "text-on-surface-variant",
              )}
            >
              {subtitle}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-sm font-bold tabular-nums", isIncome ? "text-income" : "text-expense")}>
              {amountLabel}
            </p>
            <div className="mt-1 flex justify-end">{statusBadge}</div>
          </div>
        </div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-deep">{UI_TEXT.CATEGORY_PLACEHOLDER}</label>
        {categorySelect}
      </div>
    );
  }

  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-primary-main/5",
        isDuplicate && "bg-amber-50/60 dark:bg-amber-500/10",
        !isDuplicate && needsFieldsReview && "bg-amber-50/40 dark:bg-amber-500/5",
        !row.selected && "opacity-60",
      )}
    >
      <td className="px-4 py-3 text-center sm:px-6">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(e) => onToggle(row.key, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
          aria-label={`Select ${titleHint || UI_TEXT.NO_DESCRIPTION}`}
        />
      </td>
      <td className="whitespace-nowrap px-4 py-3 sm:px-6">{dateInput}</td>
      <td className="max-w-[280px] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          {titleInput}
          <div className="w-28">{typeSelect}</div>
          <span
            className={cn(
              "truncate text-xs font-medium",
              isDuplicate
                ? "text-amber-800 dark:text-amber-200"
                : review && !row.category
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-on-surface-variant",
            )}
          >
            {subtitle}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6">{categorySelect}</td>
      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
        <div className="w-28">{amountInput}</div>
        <p className={cn("mt-1 text-xs font-semibold tabular-nums", isIncome ? "text-income" : "text-expense")}>
          {prettyDate ? amountLabel : null}
        </p>
      </td>
      <td className="px-4 py-3 sm:px-6">{statusBadge}</td>
    </tr>
  );
}

const ImportPreviewRow = memo(ImportPreviewRowInner);
export default ImportPreviewRow;
