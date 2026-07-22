"use client";

import { UI_TEXT } from "@constants";
import { AddIcon, CheckIcon, KeyboardArrowDownIcon, SearchIcon } from "@components/icons";
import { getCategoryIcon } from "@components/features/transactions/TransactionListRow";
import { cn } from "@utils/cn";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  allowAddNew?: boolean;
  onAddCategory?: (name: string) => void;
  /** Extra actions at the bottom of the open panel (Add category, AI, …). */
  panelFooter?: ReactNode | ((api: { close: () => void }) => ReactNode);
  className?: string;
  id?: string;
}

/**
 * Contained, searchable category picker for sheets/modals.
 * Avoids native <select> overflow on mobile.
 */
export function CategorySelect({
  value,
  onChange,
  options,
  placeholder = UI_TEXT.SEARCH_OR_SELECT_CATEGORY,
  disabled = false,
  allowAddNew = false,
  onAddCategory,
  panelFooter,
  className,
  id,
}: CategorySelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const canAddNew =
    allowAddNew &&
    typeof onAddCategory === "function" &&
    trimmedQuery.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmedQuery.toLowerCase());

  const SelectedIcon = value ? getCategoryIcon(value) : null;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const selectOption = (next: string) => {
    onChange(next);
    close();
  };

  const handleAddNew = () => {
    if (!canAddNew || !onAddCategory) return;
    // Parent (CategoryPicker) persists + sets value via onChange with preserved casing.
    onAddCategory(trimmedQuery);
    close();
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          if (open) setQuery("");
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full border bg-white px-4 py-2.5 text-left text-sm transition-[border-color,box-shadow]",
          "focus:outline-none focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60",
          open
            ? "border-primary-light shadow-[0_0_0_1px_rgba(93,95,239,0.12)]"
            : "border-primary-main/70 hover:border-primary-main",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {SelectedIcon && (
            <SelectedIcon className="h-4 w-4 shrink-0 text-primary-main" aria-hidden />
          )}
          <span className={cn("truncate", value ? "text-gray-900" : "text-gray-400")}>
            {value || UI_TEXT.CHOOSE}
          </span>
        </span>
        <KeyboardArrowDownIcon
          className={cn(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-elevated">
          <div className="px-3 pt-3 pb-2">
            <label
              className={cn(
                "input-pill-focus flex items-center gap-2 rounded-full border border-gray-200 bg-surface-low px-3 py-2",
                "transition-[box-shadow,border-color]",
                "focus-within:border-primary-main/40 focus-within:ring-2 focus-within:ring-primary-main/30",
              )}
            >
              <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full appearance-none bg-transparent text-sm text-brand-deep outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
                aria-label={placeholder}
                autoComplete="off"
              />
            </label>
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={UI_TEXT.CATEGORY_PLACEHOLDER}
            className="max-h-52 overflow-y-auto overscroll-contain px-1 pb-1"
          >
            {filtered.length === 0 && !canAddNew ? (
              <li className="px-3.5 py-3 text-sm text-gray-400">No categories found</li>
            ) : (
              filtered.map((opt) => {
                const selected = opt === value;
                const Icon = getCategoryIcon(opt);
                return (
                  <li key={opt} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => selectOption(opt)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-primary-soft/60 font-medium text-primary-dark"
                          : "text-gray-800 hover:bg-surface-low",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selected ? "text-primary-main" : "text-gray-500",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{opt}</span>
                      {selected && (
                        <CheckIcon className="h-4 w-4 shrink-0 text-primary-main" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {canAddNew && (
            <button
              type="button"
              onClick={handleAddNew}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-primary-main hover:bg-surface-low"
            >
              <AddIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {(UI_TEXT.ADD_AS_NEW_CATEGORY || 'Add "%s" as new category').replace(
                  "%s",
                  trimmedQuery,
                )}
              </span>
            </button>
          )}

          {panelFooter ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3 py-2.5">
              {typeof panelFooter === "function"
                ? panelFooter({ close })
                : panelFooter}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
