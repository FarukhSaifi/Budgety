"use client";

import { memo, useState } from "react";

import {
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";

import { PAYMENT_MODES_LIST } from "@constants/firestore";

import { CategoryPicker } from "@common";

import { Button } from "@components/common/Button";
import { CheckCircleIcon, WarningIcon } from "@components/icons";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { toStorageDate } from "@hooks/useDateFormatter";
import { cn } from "@utils/cn";
import { parseDate } from "@utils/dateUtils";
import type { DuplicateReason } from "@utils/duplicateDetection";
import { stagingRowNeedsReview } from "@utils/importHelpers";

import type { PaymentMode, TransactionType } from "@/types";

import type { ImportPreviewRowProps } from "./ImportPreviewRow.types";

export type { ImportPreviewRowProps, StagingRowPatch } from "./ImportPreviewRow.types";

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

const fieldClassName =
  "h-9 w-full rounded-lg border border-outline-variant bg-surface-low px-2 text-sm text-brand-deep outline-none ring-primary-main/30 focus:ring-2";

function ImportPreviewRowInner({
  row,
  isDuplicate,
  duplicateReason,
  variant,
  onToggle,
  onRowChange,
}: ImportPreviewRowProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const [editing, setEditing] = useState(false);
  const isIncome = row.type === TRANSACTION_TYPES.INCOME;
  const isAiDuplicate = Boolean(row.possibleAiDuplicate) && !isDuplicate;
  const needsFieldsReview = stagingRowNeedsReview(row, false) && !isAiDuplicate;
  const review = needsFieldsReview || isDuplicate || isAiDuplicate;
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
    : isAiDuplicate
      ? row.aiDuplicateReason || UI_TEXT.IMPORT_AI_DUPLICATE_BADGE
      : !row.category || !titleHint
        ? UI_TEXT.IMPORT_MISSING_REFERENCE
        : row.paymentMode || (isIncome ? UI_TEXT.INCOME : UI_TEXT.EXPENSE);

  const statusBadge = isDuplicate ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
      <WarningIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_DUPLICATE}
    </span>
  ) : isAiDuplicate ? (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
      title={row.aiDuplicateReason || UI_TEXT.IMPORT_AI_DUPLICATE_BADGE}
    >
      <WarningIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_AI_DUPLICATE_BADGE}
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
      onChange={(category) => onRowChange(row.key, { category })}
      type={row.type}
      titleHint={titleHint}
      amountHint={Number(row.amount) || undefined}
      showAiSuggest={showAi}
      compact
      placeholder={UI_TEXT.IMPORT_SELECT_CATEGORY}
    />
  );

  const typeBadge = (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        isIncome
          ? "bg-income-soft text-income ring-income/25"
          : "bg-expense-soft text-expense ring-expense/25",
      )}
    >
      {isIncome ? UI_TEXT.INCOME : UI_TEXT.EXPENSE}
    </span>
  );

  const editFields = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.IMPORT_EDIT_DATE}</span>
        <input
          type="date"
          value={toStorageDate(row.date) || row.date.slice(0, 10)}
          onChange={(e) => onRowChange(row.key, { date: e.target.value })}
          className={fieldClassName}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.IMPORT_EDIT_AMOUNT}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={NUMBER_FORMAT.STEP_VALUE}
          value={Number.isFinite(row.amount) ? Math.abs(row.amount) : 0}
          onChange={(e) => onRowChange(row.key, { amount: Math.abs(Number(e.target.value) || 0) })}
          className={fieldClassName}
        />
      </label>
      <label className="block space-y-1 sm:col-span-2">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.IMPORT_EDIT_TITLE}</span>
        <input
          type="text"
          value={row.title}
          onChange={(e) => onRowChange(row.key, { title: e.target.value })}
          className={fieldClassName}
          placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.IMPORT_EDIT_TYPE}</span>
        <select
          value={row.type}
          onChange={(e) =>
            onRowChange(row.key, {
              type: e.target.value as TransactionType,
              category: "",
            })
          }
          className={fieldClassName}
        >
          <option value={TRANSACTION_TYPES.EXPENSE}>{UI_TEXT.EXPENSE}</option>
          <option value={TRANSACTION_TYPES.INCOME}>{UI_TEXT.INCOME}</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.IMPORT_EDIT_PAYMENT_MODE}</span>
        <select
          value={row.paymentMode}
          onChange={(e) => onRowChange(row.key, { paymentMode: e.target.value as PaymentMode })}
          className={fieldClassName}
        >
          {PAYMENT_MODES_LIST.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-1 sm:col-span-2">
        <span className="text-[11px] font-semibold text-brand-deep">{UI_TEXT.CATEGORY_PLACEHOLDER}</span>
        {categorySelect}
      </div>
    </div>
  );

  const editToggle = (
    <Button
      type="button"
      variant={editing ? "secondary" : "outline"}
      size="sm"
      onClick={() => setEditing((prev) => !prev)}
      aria-label={UI_TEXT.IMPORT_EDIT_ROW_ARIA}
      className="text-xs"
    >
      {editing ? UI_TEXT.IMPORT_EDIT_DONE : UI_TEXT.IMPORT_EDIT_ROW}
    </Button>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border p-3 md:p-4",
          isDuplicate
            ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/10"
            : isAiDuplicate
              ? "border-sky-200 bg-sky-50/50 dark:border-sky-500/40 dark:bg-sky-500/10"
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
          <div className="min-w-0 flex-1 space-y-1.5">
            {!editing ? (
              <>
                <p className="text-xs font-medium tabular-nums text-on-surface-variant">
                  {prettyDate || UI_TEXT.DATE_PLACEHOLDER}
                </p>
                <p className="truncate text-sm font-semibold text-brand-deep">
                  {titleHint || UI_TEXT.NO_DESCRIPTION}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn("text-sm font-bold tabular-nums", isIncome ? "text-income" : "text-expense")}>
                    {amountLabel}
                  </p>
                  {typeBadge}
                </div>
                <p
                  className={cn(
                    "text-xs font-medium",
                    isDuplicate
                      ? "text-amber-800 dark:text-amber-200"
                      : isAiDuplicate
                        ? "text-sky-800 dark:text-sky-200"
                        : review && !row.category
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-on-surface-variant",
                  )}
                >
                  {subtitle}
                </p>
              </>
            ) : (
              editFields
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {statusBadge}
            {editToggle}
          </div>
        </div>
        {!editing ? (
          <>
            <label className="mb-1.5 block text-xs font-semibold text-brand-deep">
              {UI_TEXT.CATEGORY_PLACEHOLDER}
            </label>
            {categorySelect}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <tr
        className={cn(
          "group transition-colors hover:bg-primary-main/5",
          isDuplicate && "bg-amber-50/60 dark:bg-amber-500/10",
          !isDuplicate && isAiDuplicate && "bg-sky-50/60 dark:bg-sky-500/10",
          !isDuplicate && !isAiDuplicate && needsFieldsReview && "bg-amber-50/40 dark:bg-amber-500/5",
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
        <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-brand-deep sm:px-6">
          {prettyDate || "—"}
        </td>
        <td className="max-w-[280px] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-sm font-semibold text-brand-deep">
              {titleHint || UI_TEXT.NO_DESCRIPTION}
            </p>
            {typeBadge}
            <span
              className={cn(
                "truncate text-xs font-medium",
                isDuplicate
                  ? "text-amber-800 dark:text-amber-200"
                  : isAiDuplicate
                    ? "text-sky-800 dark:text-sky-200"
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
          <p className={cn("text-sm font-bold tabular-nums", isIncome ? "text-income" : "text-expense")}>
            {amountLabel}
          </p>
        </td>
        <td className="px-4 py-3 sm:px-6">
          <div className="flex flex-col items-start gap-2">
            {statusBadge}
            {editToggle}
          </div>
        </td>
      </tr>
      {editing ? (
        <tr className="bg-surface-low/60 dark:bg-surface-low/40">
          <td colSpan={6} className="px-4 py-4 sm:px-6">
            {editFields}
          </td>
        </tr>
      ) : null}
    </>
  );
}

const ImportPreviewRow = memo(ImportPreviewRowInner);
export default ImportPreviewRow;
