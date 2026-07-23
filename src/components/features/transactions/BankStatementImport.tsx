"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";

import readXlsxFile from "read-excel-file/browser";

import {
  ERROR_MESSAGES,
  IMPORT_PREVIEW_SORT,
  IMPORT_PREVIEW_SORT_KEYS,
  SORT_DIRECTIONS,
  STATEMENT_IMPORT,
  TIMEOUTS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";

import { Button } from "@components/common/Button";
import { ConfirmDialog } from "@components/common/ConfirmDialog";
import { Spinner } from "@components/common/Spinner";
import ImportPreviewRow from "@components/features/transactions/ImportPreviewRow";
import { ImportStepper, type ImportStep } from "@components/features/transactions/ImportStepper";
import {
  AddIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  BoltIcon,
  CloseIcon,
  CloudUploadIcon,
  DeleteIcon,
  DownloadIcon,
  HealthAndSafetyIcon,
  HelpOutlineIcon,
  ListAltIcon,
  VisibilityIcon,
  WarningIcon,
} from "@components/icons";
import { TransactionModal } from "@components/screens/transactions/TransactionModal";

import { useDuplicateKeys } from "@hooks/useDuplicateKeys";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addTransactionsBulk, deleteImportedTransactions } from "@store/slices/transactionsSlice";
import { addCategoriesBulk, setSearchQuery, setSelectedCategory, setViewPeriod } from "@store/slices/uiSlice";
import { detectColumnMapping, extractTransactionData } from "@utils/bankStatementParser";
import { collectNovelCategories } from "@utils/categoryNormalize";
import { cn } from "@utils/cn";
import { getMonthYear } from "@utils/dateUtils";
import { filterDuplicates } from "@utils/duplicateDetection";
import { enrichStagingCategoriesWithAi } from "@utils/enrichStagingCategories";
import {
  prepareRowForDuplicateCheck,
  rawRowsToStaging,
  sortStagingRows,
  stagingToTransactions,
  validateColumnMapping,
  type ImportPreviewSortKey,
  type SortDirection,
  type StagingRow,
} from "@utils/importHelpers";
import { showError, showInfo, showSuccess } from "@utils/toast";

import type { DiscoveredCategories, ParsedStatementTransaction } from "@/lib/statement/types";
import type { Transaction, ViewPeriod } from "@/types";

export interface BankStatementImportProps {
  onClose?: () => void;
}

function parsedToStaging(rows: ParsedStatementTransaction[]): StagingRow[] {
  return rows.map((row) => ({
    key:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: row.title || row.description || "",
    amount: Number(row.amount) || 0,
    type: row.type === "income" ? "income" : "expense",
    category: row.category,
    paymentMode: row.paymentMode,
    date: row.date,
    selected: true,
  }));
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return STATEMENT_IMPORT.ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function maxFileMb(): number {
  return Math.round(STATEMENT_IMPORT.MAX_FILE_BYTES / (1024 * 1024));
}

/** Uncheck rows that duplicate existing transactions (or earlier rows in-batch). */
function withDuplicatesUnchecked(rows: StagingRow[], existing: Transaction[]): StagingRow[] {
  if (!rows.length) return rows;

  const withIndex = rows.map((row, i) => ({ prep: prepareRowForDuplicateCheck(row), i })).filter((x) => x.prep != null);

  const prepared = withIndex.map((x) => x.prep!);
  const { duplicates } = filterDuplicates(prepared, existing);
  const dupSet = new Set(duplicates.map((d) => withIndex[d.index].i));

  if (dupSet.size === 0) return rows;
  return rows.map((row, i) => (dupSet.has(i) ? { ...row, selected: false } : row));
}

export default function BankStatementImport({ onClose }: BankStatementImportProps) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const transactions = useAppSelector((s) => s.transactions.items);
  const userCategories = useAppSelector((s) => s.ui.categories);

  const [file, setFile] = useState<File | null>(null);
  const [staging, setStaging] = useState<StagingRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<ImportPreviewSortKey>(IMPORT_PREVIEW_SORT.DEFAULT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(IMPORT_PREVIEW_SORT.DEFAULT_DIRECTION);
  const inputRef = useRef<HTMLInputElement>(null);

  const duplicateKeys = useDuplicateKeys(staging, transactions);

  const sortedStaging = useMemo(
    () => sortStagingRows(staging, sortKey, sortDirection, duplicateKeys),
    [staging, sortKey, sortDirection, duplicateKeys],
  );

  const importedTransactionsCount = useMemo(
    () => transactions.filter((t) => t.imported === true).length,
    [transactions],
  );

  const selectedCount = useMemo(() => staging.filter((r) => r.selected).length, [staging]);

  const duplicateCount = duplicateKeys.size;
  const selectedDuplicateCount = useMemo(
    () => staging.filter((r) => r.selected && duplicateKeys.has(r.key)).length,
    [staging, duplicateKeys],
  );

  const categorizedPct = useMemo(() => {
    if (!staging.length) return 0;
    const withCat = staging.filter((r) => Boolean(r.category)).length;
    return Math.round((withCat / staging.length) * 100);
  }, [staging]);

  const activeStep: ImportStep = importing || importedCount > 0 ? 3 : staging.length > 0 ? 2 : 1;

  const persistDiscoveredCategories = useCallback(
    (discovered: DiscoveredCategories | undefined) => {
      const income = discovered?.income ?? [];
      const expense = discovered?.expense ?? [];
      const count = income.length + expense.length;
      if (count === 0) return;
      dispatch(addCategoriesBulk({ income, expense }));
      showInfo(UI_TEXT.IMPORT_NEW_CATEGORIES_ADDED.replace("{count}", String(count)));
    },
    [dispatch],
  );

  const handleSort = useCallback(
    (key: ImportPreviewSortKey) => {
      if (key === sortKey) {
        setSortDirection((prevDir) => (prevDir === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC));
        return;
      }
      setSortKey(key);
      setSortDirection(
        key === IMPORT_PREVIEW_SORT_KEYS.DATE || key === IMPORT_PREVIEW_SORT_KEYS.AMOUNT
          ? SORT_DIRECTIONS.DESC
          : SORT_DIRECTIONS.ASC,
      );
    },
    [sortKey],
  );

  const resetImport = useCallback(() => {
    setStaging([]);
    setFile(null);
    setParsing(false);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const applyStaging = useCallback(
    (rows: StagingRow[]) => {
      setStaging(withDuplicatesUnchecked(rows, transactions));
    },
    [transactions],
  );

  const parseViaApi = useCallback(
    async (selected: File) => {
      const form = new FormData();
      form.append(STATEMENT_IMPORT.FIELD_NAME, selected);

      const res = await fetch("/api/parse-statement", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as {
        transactions?: ParsedStatementTransaction[];
        meta?: { discoveredCategories?: DiscoveredCategories };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || ERROR_MESSAGES.PARSE_STATEMENT_FAILED);
      }

      if (!data.transactions?.length) {
        throw new Error(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS);
      }

      const rows = parsedToStaging(data.transactions);
      const discovered =
        data.meta?.discoveredCategories ??
        collectNovelCategories(rows, {
          income: userCategories.income ?? [],
          expense: userCategories.expense ?? [],
        });
      return { rows, discovered };
    },
    [userCategories.expense, userCategories.income],
  );

  const parseExcelClient = useCallback(
    async (selected: File) => {
      const sheets = await readXlsxFile(selected);
      if (!sheets || sheets.length === 0) {
        throw new Error(ERROR_MESSAGES.EXCEL_NO_SHEETS);
      }

      const first = sheets[0] as { data?: unknown[][] } | unknown[];
      const rows: unknown[][] =
        Array.isArray(first) && !("data" in (first as object))
          ? (first as unknown[][])
          : ((first as { data?: unknown[][] }).data ?? []);

      if (!rows || rows.length < 2) {
        throw new Error(ERROR_MESSAGES.EXCEL_EMPTY);
      }

      const headers = rows[0].map((h) => String(h ?? "").trim());
      if (headers.length === 0 || headers.every((h) => !h)) {
        throw new Error(ERROR_MESSAGES.EXCEL_NO_HEADERS);
      }

      const mapping = detectColumnMapping(headers);
      const validation = validateColumnMapping(mapping);
      if (!validation.valid) {
        throw new Error(
          ERROR_MESSAGES.EXCEL_MISSING_COLUMNS.replace(
            "{missing}",
            (validation.missingColumns ?? []).join(", "),
          ).replace("{found}", headers.join(", ")),
        );
      }

      const parsed = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row) || row.length === 0) continue;
        const values = row.map((cell) => {
          if (cell === null || cell === undefined) return "";
          if (typeof cell === "number") return String(cell);
          if (cell instanceof Date) return cell.toISOString().slice(0, 10);
          return String(cell || "").trim();
        });
        if (values.every((v) => !v || v === "")) continue;
        parsed.push(extractTransactionData(values, mapping));
      }

      if (parsed.length === 0) {
        throw new Error(ERROR_MESSAGES.EXCEL_NO_TRANSACTIONS);
      }

      const stagingRows = rawRowsToStaging(parsed);
      const existing = {
        income: userCategories.income ?? [],
        expense: userCategories.expense ?? [],
      };
      return enrichStagingCategoriesWithAi(stagingRows, existing);
    },
    [userCategories.expense, userCategories.income],
  );

  const handleFile = useCallback(
    async (selected: File) => {
      if (!isAcceptedFile(selected)) {
        showError(ERROR_MESSAGES.STATEMENT_UNSUPPORTED_TYPE);
        return;
      }

      if (selected.size > STATEMENT_IMPORT.MAX_FILE_BYTES) {
        showError(ERROR_MESSAGES.STATEMENT_FILE_TOO_LARGE.replace("{maxMb}", String(maxFileMb())));
        return;
      }

      setFile(selected);
      setParsing(true);
      setStaging([]);

      try {
        const name = selected.name.toLowerCase();
        let rows: StagingRow[];
        let discovered: DiscoveredCategories = { income: [], expense: [] };

        if (name.endsWith(".xlsx")) {
          showInfo(UI_TEXT.IMPORT_PARSING);
          const result = await parseExcelClient(selected);
          rows = result.rows;
          discovered = result.discovered;
        } else if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
          throw new Error(ERROR_MESSAGES.EXCEL_LEGACY_XLS_UNSUPPORTED);
        } else {
          showInfo(UI_TEXT.IMPORT_PARSING);
          const result = await parseViaApi(selected);
          rows = result.rows;
          discovered = result.discovered;
        }

        persistDiscoveredCategories(discovered);
        applyStaging(rows);
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : ERROR_MESSAGES.PARSE_STATEMENT_FAILED;
        showError(message);
        setFile(null);
      } finally {
        setParsing(false);
      }
    },
    [applyStaging, parseExcelClient, parseViaApi, persistDiscoveredCategories],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) void handleFile(selected);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) void handleFile(selected);
  };

  const handleToggle = useCallback((key: string, selected: boolean) => {
    setStaging((prev) => prev.map((row) => (row.key === key ? { ...row, selected } : row)));
  }, []);

  const handleCategoryChange = useCallback((key: string, category: string) => {
    setStaging((prev) => prev.map((row) => (row.key === key ? { ...row, category } : row)));
  }, []);

  const focusUiOnImported = useCallback(
    (saved: Transaction[]) => {
      const buckets = new Map<string, { month: number; year: number }>();
      saved.forEach((tx) => {
        const my = getMonthYear(tx.date);
        if (!my) return;
        buckets.set(`${my.year}-${my.month}`, my);
      });

      dispatch(setSelectedCategory(""));
      dispatch(setSearchQuery(""));

      if (buckets.size === 1) {
        const only = [...buckets.values()][0];
        dispatch(
          setViewPeriod({
            viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
            selectedMonth: only.month,
            selectedYear: only.year,
          }),
        );
        return;
      }

      if (buckets.size > 1) {
        dispatch(setViewPeriod({ viewPeriod: VIEW_PERIODS.ALL as ViewPeriod }));
      }
    },
    [dispatch],
  );

  const handleImport = async () => {
    if (!userId) {
      showError("You must be signed in to import transactions. Please refresh and log in again.");
      return;
    }

    const selected = staging.filter((r) => r.selected);
    if (selected.length === 0) {
      showError(UI_TEXT.IMPORT_NONE_SELECTED);
      return;
    }

    // Respect user selection: import every checked row, including ones flagged as duplicates.
    const prepared = stagingToTransactions(selected, userId);
    const selectedDupCount = selected.filter((r) => duplicateKeys.has(r.key)).length;

    setImporting(true);
    try {
      const saved = await dispatch(addTransactionsBulk(prepared)).unwrap();
      const count = saved.length;
      setImportedCount(count);
      focusUiOnImported(saved);
      resetImport();

      if (selectedDupCount > 0) {
        showSuccess(
          UI_TEXT.IMPORT_SUCCESS_WITH_DUPLICATES.replace("{count}", String(count)).replace(
            "{duplicates}",
            String(selectedDupCount),
          ),
        );
      } else {
        showSuccess(UI_TEXT.IMPORT_SUCCESS_COUNT.replace("{count}", String(count)));
      }
      setTimeout(() => setImportedCount(0), TIMEOUTS.IMPORT_SUCCESS);
      onClose?.();
    } catch (err) {
      const raw =
        typeof err === "string"
          ? err
          : err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message || "")
            : "";
      const message = /permission|insufficient/i.test(raw)
        ? "Firestore blocked the save. Deploy firestore.rules and ensure you are signed in."
        : raw || ERROR_MESSAGES.SAVE_FAILED;
      showError(message);
    } finally {
      setImporting(false);
    }
  };

  const confirmCleanup = async () => {
    if (!userId) return;
    const count = importedTransactionsCount;
    try {
      await dispatch(deleteImportedTransactions(userId)).unwrap();
      showSuccess(UI_TEXT.CLEANUP_SUCCESS.replace("{count}", count.toString()));
    } catch {
      showError(ERROR_MESSAGES.SAVE_FAILED);
    } finally {
      setShowCleanupDialog(false);
    }
  };

  const onSupport = () => {
    showInfo(UI_TEXT.IMPORT_SUPPORT_TIP);
  };

  const setAllSelected = (selected: boolean) => {
    setStaging((prev) => prev.map((row) => ({ ...row, selected })));
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 bg-surface px-4 py-5 sm:px-6 md:space-y-8 md:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-brand-deep md:text-[32px] md:leading-10">
                {UI_TEXT.IMPORT_TRANSACTIONS}
              </h1>
              <p className="mt-1 text-sm text-gray-500 md:text-base">{UI_TEXT.IMPORT_TRANSACTIONS_SUBTITLE}</p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 md:hidden"
                aria-label={UI_TEXT.HIDE_IMPORT}
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hidden md:inline-flex"
              leftIcon={<CloseIcon className="h-4 w-4" />}
            >
              {UI_TEXT.CANCEL}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSupport}
            leftIcon={<HelpOutlineIcon className="h-4 w-4" />}
          >
            {UI_TEXT.IMPORT_SUPPORT}
          </Button>
          <a
            href={UI_TEXT.SAMPLE_CSV_PATH}
            download={UI_TEXT.SAMPLE_CSV_FILENAME}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary-main px-3 text-sm font-medium text-white shadow-glow transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main/40"
          >
            <DownloadIcon className="h-4 w-4" />
            {UI_TEXT.IMPORT_SAMPLE_CSV}
          </a>
          {importedTransactionsCount > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCleanupDialog(true)}
              leftIcon={<DeleteIcon className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">{UI_TEXT.CLEANUP_IMPORTED_DATA}</span>
              <span className="sm:hidden">Cleanup</span>
              <span className="ml-1">({importedTransactionsCount})</span>
            </Button>
          )}
        </div>
      </div>

      <ImportStepper activeStep={activeStep} />

      {importedCount > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:text-income">
          {UI_TEXT.IMPORT_SUCCESS_COUNT.replace("{count}", String(importedCount))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative cursor-pointer rounded-3xl border-2 border-dashed bg-white/60 px-4 py-10 text-center transition-all sm:py-14",
          dragOver
            ? "border-primary-main bg-primary-soft/40"
            : "border-primary-main/20 hover:border-primary-main/50 hover:bg-white",
          parsing && "pointer-events-none opacity-70",
        )}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,.pdf,.xlsx" onChange={onInputChange} className="hidden" />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner label={UI_TEXT.IMPORT_PARSING} />
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-main/5 text-primary-main transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
              <CloudUploadIcon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h3 className="text-lg font-semibold text-brand-deep sm:text-xl">
              {file ? <span className="break-all">{file.name}</span> : UI_TEXT.UPLOAD_DROP_HINT}
            </h3>
            <p className="mt-1 text-sm text-gray-500 md:text-base">
              {UI_TEXT.UPLOAD_BROWSE_HINT.replace("{maxMb}", String(maxFileMb()))}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-lg bg-surface-low px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {UI_TEXT.IMPORT_EXT_CSV}
              </span>
              <span className="rounded-lg bg-surface-low px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {UI_TEXT.IMPORT_EXT_XLSX}
              </span>
              <span className="rounded-lg bg-surface-low px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {UI_TEXT.IMPORT_EXT_PDF}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Manual add fallback */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{UI_TEXT.AUTH_OR}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddTransactionModalOpen(true)}
          leftIcon={<AddIcon className="h-4 w-4" />}
        >
          {UI_TEXT.ADD_TRANSACTION}
        </Button>
      </div>

      <TransactionModal open={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} />

      {/* Preview */}
      {staging.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card">
          <div className="flex flex-col gap-3 border-b border-gray-100 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-deep">
              <ListAltIcon className="h-5 w-5 text-primary-main" />
              {UI_TEXT.IMPORT_PREVIEW_TITLE}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 sm:gap-3 sm:text-sm">
              <span>
                {UI_TEXT.IMPORT_AUTO_MAPPING}{" "}
                <span className="font-semibold text-income">{UI_TEXT.IMPORT_AUTO_MAPPING_ACTIVE}</span>
              </span>
              <span className="hidden h-4 w-px bg-gray-200 sm:block" aria-hidden />
              <span>{UI_TEXT.IMPORT_TRANSACTIONS_FOUND.replace("{count}", String(staging.length))}</span>
              <button type="button" onClick={() => setAllSelected(true)} className="text-primary-main hover:underline">
                {UI_TEXT.IMPORT_SELECT_ALL}
              </button>
              <button type="button" onClick={() => setAllSelected(false)} className="text-gray-500 hover:underline">
                {UI_TEXT.IMPORT_DESELECT_ALL}
              </button>
            </div>
          </div>

          {duplicateCount > 0 ? (
            <div
              role="status"
              className="flex items-start gap-3 border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:px-6"
            >
              <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
              <p className="font-medium">
                {selectedDuplicateCount > 0
                  ? UI_TEXT.IMPORT_DUPLICATE_BANNER.replace("{count}", String(duplicateCount)).replace(
                      "{selected}",
                      String(selectedDuplicateCount),
                    )
                  : UI_TEXT.IMPORT_DUPLICATE_BANNER_NONE_SELECTED.replace("{count}", String(duplicateCount))}
              </p>
            </div>
          ) : null}

          <div className="hidden max-h-[50vh] overflow-auto lg:block">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-surface-low/90 backdrop-blur dark:bg-surface-low/95">
                <tr className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 text-center sm:px-6">✓</th>
                  <ImportSortableHeader
                    label={UI_TEXT.DATE}
                    columnKey={IMPORT_PREVIEW_SORT_KEYS.DATE}
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <ImportSortableHeader
                    label={UI_TEXT.DESCRIPTION}
                    columnKey={IMPORT_PREVIEW_SORT_KEYS.DESCRIPTION}
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <ImportSortableHeader
                    label={UI_TEXT.CATEGORY_PLACEHOLDER}
                    columnKey={IMPORT_PREVIEW_SORT_KEYS.CATEGORY}
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <ImportSortableHeader
                    label={UI_TEXT.AMOUNT}
                    columnKey={IMPORT_PREVIEW_SORT_KEYS.AMOUNT}
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <ImportSortableHeader
                    label={UI_TEXT.STATUS}
                    columnKey={IMPORT_PREVIEW_SORT_KEYS.STATUS}
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-outline-variant/40">
                {sortedStaging.map((row) => (
                  <ImportPreviewRow
                    key={row.key}
                    row={row}
                    isDuplicate={duplicateKeys.has(row.key)}
                    duplicateReason={duplicateKeys.get(row.key)}
                    onToggle={handleToggle}
                    onCategoryChange={handleCategoryChange}
                    variant="table"
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto p-3 lg:hidden">
            {sortedStaging.map((row) => (
              <ImportPreviewRow
                key={row.key}
                row={row}
                isDuplicate={duplicateKeys.has(row.key)}
                duplicateReason={duplicateKeys.get(row.key)}
                onToggle={handleToggle}
                onCategoryChange={handleCategoryChange}
                variant="card"
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-main/10 text-primary-main">
                <BoltIcon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                {UI_TEXT.IMPORT_AI_SUGGESTED.replace("{pct}", String(categorizedPct))}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button onClick={resetImport} variant="ghost" disabled={importing} className="sm:min-w-[120px]">
                {UI_TEXT.IMPORT_DISCARD_ALL}
              </Button>
              <Button
                onClick={() => void handleImport()}
                variant="primary"
                loading={importing}
                className="sm:min-w-[160px]"
              >
                {UI_TEXT.IMPORT_ITEMS.replace("{count}", String(selectedCount))}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Info cards */}
      {staging.length === 0 && !parsing && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <InfoCard
            icon={<HealthAndSafetyIcon className="h-6 w-6" />}
            title={UI_TEXT.IMPORT_PRIVACY_TITLE}
            body={UI_TEXT.IMPORT_PRIVACY_BODY}
          />
          <InfoCard
            icon={<BoltIcon className="h-6 w-6" />}
            title={UI_TEXT.IMPORT_AI_CAT_TITLE}
            body={UI_TEXT.IMPORT_AI_CAT_BODY}
          />
          <InfoCard
            icon={<VisibilityIcon className="h-6 w-6" />}
            title={UI_TEXT.IMPORT_SAFE_SYNC_TITLE}
            body={UI_TEXT.IMPORT_SAFE_SYNC_BODY}
          />
        </div>
      )}

      <ConfirmDialog
        open={showCleanupDialog}
        onCancel={() => setShowCleanupDialog(false)}
        onConfirm={() => void confirmCleanup()}
        title={UI_TEXT.CLEANUP_IMPORTED_TITLE}
        message={`${UI_TEXT.CONFIRM_CLEANUP_IMPORTED} ${importedTransactionsCount} transaction(s) will be deleted.`}
        confirmLabel={UI_TEXT.DELETE}
        danger
      />
    </div>
  );
}

function ImportSortableHeader({
  label,
  columnKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  columnKey: ImportPreviewSortKey;
  activeKey: ImportPreviewSortKey;
  direction: SortDirection;
  onSort: (key: ImportPreviewSortKey) => void;
}) {
  const active = activeKey === columnKey;
  const ariaSort = active ? (direction === SORT_DIRECTIONS.ASC ? "ascending" : "descending") : "none";

  return (
    <th className="px-4 py-3 sm:px-6" aria-sort={ariaSort} scope="col">
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors",
          "text-on-surface-variant hover:bg-primary-main/10 hover:text-brand-deep",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main/40",
          active && "text-primary-main",
        )}
        aria-label={UI_TEXT.SORT_BY_COLUMN.replace("{column}", label)}
      >
        <span>{label}</span>
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
          {active ? (
            direction === SORT_DIRECTIONS.ASC ? (
              <ArrowUpwardIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownwardIcon className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="flex flex-col leading-none opacity-40">
              <ArrowUpwardIcon className="h-2.5 w-2.5 -mb-0.5" />
              <ArrowDownwardIcon className="h-2.5 w-2.5 -mt-0.5" />
            </span>
          )}
        </span>
      </button>
    </th>
  );
}

function InfoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-card">
      <div className="text-primary-main">{icon}</div>
      <h4 className="text-sm font-bold text-brand-deep">{title}</h4>
      <p className="text-xs leading-relaxed text-gray-500 sm:text-sm">{body}</p>
    </div>
  );
}
