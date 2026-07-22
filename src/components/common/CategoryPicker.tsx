"use client";

import { TRANSACTION_TYPES, UI_TEXT } from "@constants";
import { Button } from "@components/common/Button";
import { CategorySelect } from "@components/common/CategorySelect";
import { Field, Input } from "@components/common/Field";
import { Modal } from "@components/common/Modal";
import { AddIcon, BoltIcon } from "@components/icons";
import { useCategories } from "@hooks/useCategories";
import { useAppDispatch } from "@store/hooks";
import { addCategory } from "@store/slices/uiSlice";
import { cn } from "@utils/cn";
import { requestCategorySuggestion } from "@utils/suggestCategoryClient";
import { showError, showSuccess } from "@utils/toast";
import type { TransactionType } from "@/types";
import { useId, useState } from "react";

export interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  /** Categories list / default type for new categories. */
  type: TransactionType;
  /**
   * When true, the add-category modal lets the user pick Income vs Expense.
   * When false (default), type is inherited from `type` (transaction context).
   */
  allowTypeChange?: boolean;
  /** Called when AI or add-modal changes type (only if allowTypeChange). */
  onTypeChange?: (type: TransactionType) => void;
  /** Title/description used for AI suggestions. */
  titleHint?: string;
  amountHint?: number;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  selectClassName?: string;
  placeholder?: string;
  /** Show “Suggest with AI” when a title hint is available. Default: true. */
  showAiSuggest?: boolean;
  /** Compact layout for dense tables (import preview). */
  compact?: boolean;
}

/**
 * Shared category picker with searchable list, “Add category”, and optional AI suggest.
 * Persists custom names via Redux `addCategory` (localStorage per user).
 */
export function CategoryPicker({
  value,
  onChange,
  type,
  allowTypeChange = false,
  onTypeChange,
  titleHint,
  amountHint,
  disabled = false,
  id,
  className,
  selectClassName,
  placeholder,
  showAiSuggest = true,
  compact = false,
}: CategoryPickerProps) {
  const dispatch = useAppDispatch();
  const categories = useCategories();
  const selectId = useId();
  const resolvedId = id ?? selectId;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalType, setModalType] = useState<TransactionType>(type);
  const [modalError, setModalError] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const options = categories.getByType(type);
  const canSuggest = Boolean(showAiSuggest && String(titleHint ?? "").trim());

  const openAddModal = (initialName = "") => {
    setModalName(initialName);
    setModalType(type);
    setModalError("");
    setModalOpen(true);
  };

  const closeAddModal = () => {
    setModalOpen(false);
    setModalName("");
    setModalError("");
  };

  const commitCategory = (name: string, categoryType: TransactionType) => {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return;

    const list = categories.getByType(categoryType);
    const existing = list.find((c) => c.toLowerCase() === trimmed.toLowerCase());
    const finalName = existing ?? trimmed;

    if (!existing) {
      dispatch(addCategory({ name: finalName, type: categoryType }));
      showSuccess(UI_TEXT.CATEGORY_CREATED.replace("{name}", finalName));
    }

    if (allowTypeChange && categoryType !== type) {
      onTypeChange?.(categoryType);
    }
    onChange(finalName);
  };

  const handleSaveNew = () => {
    const trimmed = modalName.trim();
    if (!trimmed) {
      setModalError(UI_TEXT.ADD_NEW_CATEGORY_REQUIRED);
      return;
    }
    const categoryType = allowTypeChange ? modalType : type;
    commitCategory(trimmed, categoryType);
    closeAddModal();
  };

  const handleAddFromSearch = (name: string) => {
    commitCategory(name, type);
  };

  const handleSuggest = async () => {
    const title = String(titleHint ?? "").trim();
    if (!title || suggesting) return;

    setSuggesting(true);
    try {
      const result = await requestCategorySuggestion({
        title,
        amount: amountHint,
        typeHint: type,
        existingCategories: {
          income: categories.income,
          expense: categories.expense,
        },
      });

      if (!result.ok) {
        showError(
          result.unavailable
            ? UI_TEXT.SUGGEST_CATEGORY_UNAVAILABLE
            : UI_TEXT.SUGGEST_CATEGORY_FAILED,
        );
        if (!modalOpen) openAddModal("");
        return;
      }

      const suggestedType = allowTypeChange ? result.data.type : type;
      commitCategory(result.data.category, suggestedType);
      if (modalOpen) closeAddModal();
    } finally {
      setSuggesting(false);
    }
  };

  const typeLabel =
    type === TRANSACTION_TYPES.INCOME ? UI_TEXT.INCOME : UI_TEXT.EXPENSE;

  return (
    <div className={cn("w-full", className)}>
      <CategorySelect
        id={resolvedId}
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
        allowAddNew
        onAddCategory={handleAddFromSearch}
        placeholder={
          placeholder ||
          (compact
            ? UI_TEXT.IMPORT_SELECT_CATEGORY
            : UI_TEXT.SEARCH_OR_SELECT_CATEGORY)
        }
        className={cn(
          compact &&
            !value &&
            "[&>button]:border-2 [&>button]:border-expense/30",
          selectClassName,
        )}
        panelFooter={({ close }) => (
          <>
            {canSuggest && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || suggesting}
                loading={suggesting}
                leftIcon={<BoltIcon className="h-4 w-4" />}
                onClick={() => {
                  close();
                  void handleSuggest();
                }}
              >
                {suggesting
                  ? UI_TEXT.SUGGEST_CATEGORY_LOADING
                  : UI_TEXT.SUGGEST_WITH_AI}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              leftIcon={<AddIcon className="h-4 w-4" />}
              onClick={() => {
                close();
                openAddModal("");
              }}
              aria-label={UI_TEXT.ADD_NEW_CATEGORY_TITLE}
            >
              {UI_TEXT.ADD_CATEGORY_OPTION.replace("+ ", "")}
            </Button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={closeAddModal}
        size="sm"
        title={UI_TEXT.ADD_NEW_CATEGORY_TITLE}
        footer={
          <>
            <Button variant="ghost" onClick={closeAddModal}>
              {UI_TEXT.CANCEL}
            </Button>
            <Button variant="primary" onClick={handleSaveNew}>
              {UI_TEXT.SAVE}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {UI_TEXT.ADD_CATEGORY_TYPE_HINT.replace(
              "{type}",
              allowTypeChange
                ? modalType === "income"
                  ? UI_TEXT.INCOME
                  : UI_TEXT.EXPENSE
                : typeLabel,
            )}
          </p>

          {allowTypeChange && (
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              {(
                [
                  [TRANSACTION_TYPES.EXPENSE, UI_TEXT.EXPENSE],
                  [TRANSACTION_TYPES.INCOME, UI_TEXT.INCOME],
                ] as const
              ).map(([valueOption, label]) => (
                <button
                  key={valueOption}
                  type="button"
                  onClick={() => setModalType(valueOption as TransactionType)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium transition-colors",
                    modalType === valueOption
                      ? "bg-white text-primary-main shadow-sm"
                      : "text-gray-500",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <Field
            label={UI_TEXT.ADD_NEW_CATEGORY_LABEL}
            required
            error={modalError || undefined}
          >
            <Input
              autoFocus
              value={modalName}
              placeholder={UI_TEXT.ADD_NEW_CATEGORY_PLACEHOLDER}
              onChange={(e) => {
                setModalName(e.target.value);
                if (modalError) setModalError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveNew();
                }
              }}
            />
          </Field>

          {canSuggest && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              disabled={suggesting}
              loading={suggesting}
              leftIcon={<BoltIcon className="h-4 w-4" />}
              onClick={handleSuggest}
            >
              {suggesting
                ? UI_TEXT.SUGGEST_CATEGORY_LOADING
                : UI_TEXT.SUGGEST_WITH_AI}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
