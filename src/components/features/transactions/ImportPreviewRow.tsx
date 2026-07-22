"use client";

import {
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import {
  CheckCircleIcon,
  WarningIcon,
} from "@components/icons";
import { CategoryPicker } from "@common";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import type { StagingRow } from "@utils/importHelpers";
import { cn } from "@utils/cn";
import { parseDate } from "@utils/dateUtils";
import { memo } from "react";

export interface ImportPreviewRowProps {
  row: StagingRow;
  index: number;
  isDuplicate: boolean;
  variant: "table" | "card";
  onToggle: (index: number, selected: boolean) => void;
  onCategoryChange: (index: number, category: string) => void;
}

function needsReview(row: StagingRow, isDuplicate: boolean): boolean {
  return (
    isDuplicate ||
    !row.category ||
    !String(row.title || "").trim() ||
    !row.date ||
    !Number(row.amount)
  );
}

function formatPreviewDate(date: string): string {
  const d = parseDate(date);
  if (!d) return date || "";
  return d.format("MMM D, YYYY");
}

function ImportPreviewRowInner({
  row,
  index,
  isDuplicate,
  variant,
  onToggle,
  onCategoryChange,
}: ImportPreviewRowProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const isIncome = row.type === TRANSACTION_TYPES.INCOME;
  const review = needsReview(row, isDuplicate);
  const prettyDate = formatPreviewDate(row.date);
  const titleHint = String(row.title || "").trim();
  const showAi =
    Boolean(titleHint) &&
    (review ||
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
    ? UI_TEXT.IMPORT_DUPLICATE_BADGE
    : !row.category || !titleHint
      ? UI_TEXT.IMPORT_MISSING_REFERENCE
      : row.paymentMode || (isIncome ? UI_TEXT.INCOME : UI_TEXT.EXPENSE);

  const statusBadge = review ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-expense">
      <WarningIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_REVIEW}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-income">
      <CheckCircleIcon className="h-3 w-3" />
      {UI_TEXT.IMPORT_STATUS_VALID}
    </span>
  );

  const categorySelect = (
    <CategoryPicker
      value={row.category || ""}
      onChange={(category) => onCategoryChange(index, category)}
      type={row.type}
      titleHint={titleHint}
      amountHint={Number(row.amount) || undefined}
      showAiSuggest={showAi}
      compact
      placeholder={UI_TEXT.IMPORT_SELECT_CATEGORY}
    />
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border p-3 md:p-4",
          review
            ? "border-red-100 bg-red-50/40"
            : row.selected
              ? "border-primary-main/20 bg-white"
              : "border-gray-200 bg-gray-50",
          !row.selected && "opacity-70",
        )}
      >
        <div className="mb-3 flex items-start gap-3">
          <input
            type="checkbox"
            checked={row.selected}
            onChange={(e) => onToggle(index, e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
            aria-label={`Select transaction ${index + 1}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500">{prettyDate}</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-brand-deep">
              {row.title || UI_TEXT.NO_DESCRIPTION}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                review && !row.category ? "text-expense" : "text-gray-400",
              )}
            >
              {subtitle}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                isIncome ? "text-income" : "text-expense",
              )}
            >
              {amountLabel}
            </p>
            <div className="mt-1 flex justify-end">{statusBadge}</div>
          </div>
        </div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
          {UI_TEXT.CATEGORY_PLACEHOLDER}
        </label>
        {categorySelect}
      </div>
    );
  }

  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-primary-main/5",
        review && "bg-red-50/30",
        !row.selected && "opacity-60",
      )}
    >
      <td className="px-4 py-3 text-center sm:px-6">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={(e) => onToggle(index, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-main focus:ring-primary-main"
          aria-label={`Select transaction ${index + 1}`}
        />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-brand-deep sm:px-6">
        {prettyDate}
      </td>
      <td className="max-w-[240px] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-brand-deep">
            {row.title || UI_TEXT.NO_DESCRIPTION}
          </span>
          <span
            className={cn(
              "truncate text-xs",
              review && !row.category ? "text-expense" : "text-gray-400",
            )}
          >
            {subtitle}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 sm:px-6">{categorySelect}</td>
      <td
        className={cn(
          "whitespace-nowrap px-4 py-3 text-sm font-bold tabular-nums sm:px-6",
          isIncome ? "text-income" : "text-expense",
        )}
      >
        {amountLabel}
      </td>
      <td className="px-4 py-3 sm:px-6">{statusBadge}</td>
    </tr>
  );
}

const ImportPreviewRow = memo(ImportPreviewRowInner);
export default ImportPreviewRow;
