"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

import readXlsxFile from "read-excel-file/browser";

import {
  ERROR_MESSAGES,
  GMAIL_DEFAULTS,
  GMAIL_ERROR_MESSAGES,
  GMAIL_UI_TEXT,
  IMPORT_FILE_STATUS,
  IMPORT_JOB_STATUS,
  IMPORT_PREVIEW_SORT,
  IMPORT_PREVIEW_SORT_KEYS,
  IMPORT_PROGRESS_STAGES,
  IMPORT_RECORD_STATUS,
  IMPORT_STREAM,
  IMPORT_STREAM_UI,
  PERCENTAGE_THRESHOLDS,
  SORT_DIRECTIONS,
  STATEMENT_IMPORT,
  TIMEOUTS,
  UI_TEXT,
} from "@constants";

import { DEFAULT_CATEGORY_COLOR } from "@constants/firestore";

import type { GmailLockedAttachment, GmailSyncResponse } from "@/types/gmail";

import { Button } from "@components/common/Button";
import { ConfirmDialog } from "@components/common/ConfirmDialog";
import { ProgressPercent } from "@components/common/ProgressPercent";
import { GmailSyncPanel } from "@components/features/transactions/GmailSyncPanel";
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
  KeyIcon,
  ListAltIcon,
  ShieldLockIcon,
  VisibilityIcon,
  WarningIcon,
} from "@components/icons";
import { TransactionModal } from "@components/screens/transactions/TransactionModal";

import { useDuplicateKeys } from "@hooks/useDuplicateKeys";
import { useEstimatedProgress } from "@hooks/useEstimatedProgress";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addCategoriesBulk } from "@store/slices/categoriesSlice";
import {
  addTransactionsBulk,
  deleteImportedTransactions,
  deleteTransactionsByIds,
} from "@store/slices/transactionsSlice";
import { detectColumnMapping, extractTransactionData } from "@utils/bankStatementParser";
import { collectNovelCategories } from "@utils/categoryNormalize";
import { cn } from "@utils/cn";
import { filterDuplicates } from "@utils/duplicateDetection";
import { enrichStagingCategoriesWithAi } from "@utils/enrichStagingCategories";
import { focusUiOnImported } from "@utils/focusUiOnImported";
import { clearLockedQueue, mergeLockedQueue, readLockedQueue, removeLockedItem } from "@utils/gmailLockedQueue";
import { clearReviewStaging, readReviewStaging, takeReviewStaging } from "@utils/gmailReviewQueue";
import {
  parsedToStaging,
  prepareRowForDuplicateCheck,
  rawRowsToStaging,
  sortStagingRows,
  validateColumnMapping,
  type ImportPreviewSortKey,
  type SortDirection,
  type StagingRow,
} from "@utils/importHelpers";
import type { ImportStreamJob, ImportStreamProgress } from "@utils/importStream.types";
import {
  attachSourceToRows,
  buildImportFingerprint,
  clearImportStreamJob,
  countRecordsByStatus,
  createImportStreamJob,
  jobHasRetryableWork,
  listFailedFileNames,
  listFailedRecordSamples,
  markJobInterrupted,
  preferFresherImportJob,
  readImportStreamJob,
  writeImportStreamJob,
} from "@utils/importStreamJob";
import { interruptImportStream, runImportStream } from "@utils/importStreamRunner";
import { showError, showInfo, showSuccess } from "@utils/toast";

import { authedFetch } from "@/lib/authedApiClient";
import { mapStatementApiError } from "@/lib/statement/pdfPasswordError";
import type { DiscoveredCategories, ParsedStatementTransaction } from "@/lib/statement/types";
import type { Transaction } from "@/types";

import type { BankStatementImportProps } from "./BankStatementImport.types";

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
  const catalog = useAppSelector((s) => s.categories.items);
  const rules = useAppSelector((s) => s.rules.items);

  const [file, setFile] = useState<File | null>(null);
  const [staging, setStaging] = useState<StagingRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportStreamProgress | null>(null);
  const [streamJobSnapshot, setStreamJobSnapshot] = useState<ImportStreamJob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [lastImportBatchIds, setLastImportBatchIds] = useState<string[]>([]);
  const importInFlightRef = useRef(false);
  const activeStreamJobRef = useRef<ImportStreamJob | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pdfLocked, setPdfLocked] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [pdfPasswordError, setPdfPasswordError] = useState<string | null>(null);
  const [gmailLockedQueue, setGmailLockedQueue] = useState<GmailLockedAttachment[]>([]);
  /** Session baseline for unlock progress (unlocked = baseline − remaining). */
  const [initialLockedTotal, setInitialLockedTotal] = useState(0);
  const [unlockingGmail, setUnlockingGmail] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<ImportPreviewSortKey>(IMPORT_PREVIEW_SORT.DEFAULT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(IMPORT_PREVIEW_SORT.DEFAULT_DIRECTION);
  const [canRetryParse, setCanRetryParse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const unlockPanelRef = useRef<HTMLElement>(null);
  const shouldScrollToPreviewRef = useRef(false);
  const shouldScrollToUnlockRef = useRef(false);
  const lastFailedFileRef = useRef<File | null>(null);
  const prevGmailLockedCountRef = useRef(0);
  const parseProgress = useEstimatedProgress(parsing, { stages: IMPORT_PROGRESS_STAGES });

  useEffect(() => {
    if (!userId) {
      setGmailLockedQueue([]);
      setInitialLockedTotal(0);
      prevGmailLockedCountRef.current = 0;
      return;
    }

    const refreshQueue = () => {
      setGmailLockedQueue(readLockedQueue(userId));
    };

    refreshQueue();

    const onQueueChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      refreshQueue();
    };

    const onVisible = () => {
      if (document.visibilityState === GMAIL_DEFAULTS.DOCUMENT_VISIBLE_STATE) refreshQueue();
    };

    window.addEventListener(GMAIL_DEFAULTS.LOCKED_QUEUE_CHANGED_EVENT, onQueueChanged);
    window.addEventListener(GMAIL_DEFAULTS.WINDOW_FOCUS_EVENT, refreshQueue);
    document.addEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onVisible);
    return () => {
      window.removeEventListener(GMAIL_DEFAULTS.LOCKED_QUEUE_CHANGED_EVENT, onQueueChanged);
      window.removeEventListener(GMAIL_DEFAULTS.WINDOW_FOCUS_EVENT, refreshQueue);
      document.removeEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onVisible);
    };
  }, [userId]);

  useEffect(() => {
    const remaining = gmailLockedQueue.length;
    if (remaining === 0) {
      setInitialLockedTotal(0);
      prevGmailLockedCountRef.current = 0;
      return;
    }
    setInitialLockedTotal((prev) => {
      if (prev === 0) {
        shouldScrollToUnlockRef.current = true;
        return remaining;
      }
      const grewBy = Math.max(0, remaining - prevGmailLockedCountRef.current);
      if (grewBy > 0) shouldScrollToUnlockRef.current = true;
      return prev + grewBy;
    });
    prevGmailLockedCountRef.current = remaining;
  }, [gmailLockedQueue]);

  useEffect(() => {
    if (!shouldScrollToPreviewRef.current || staging.length === 0) return;
    shouldScrollToPreviewRef.current = false;
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [staging.length]);

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

  const aiDuplicateCount = useMemo(
    () => staging.filter((r) => r.possibleAiDuplicate && !duplicateKeys.has(r.key)).length,
    [staging, duplicateKeys],
  );
  const selectedAiDuplicateCount = useMemo(
    () => staging.filter((r) => r.selected && r.possibleAiDuplicate && !duplicateKeys.has(r.key)).length,
    [staging, duplicateKeys],
  );

  const categorizedPct = useMemo(() => {
    if (!staging.length) return 0;
    const withCat = staging.filter((r) => Boolean(r.category)).length;
    return Math.round((withCat / staging.length) * 100);
  }, [staging]);

  const activeGmailLocked = gmailLockedQueue[0] ?? null;
  const showUnlockPanel = pdfLocked || gmailLockedQueue.length > 0;

  useEffect(() => {
    if (!shouldScrollToUnlockRef.current || !showUnlockPanel) return;
    shouldScrollToUnlockRef.current = false;
    unlockPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showUnlockPanel, gmailLockedQueue.length]);

  const gmailLockedRemaining = gmailLockedQueue.length;
  const gmailLockedTotal = Math.max(initialLockedTotal, gmailLockedRemaining);
  const gmailUnlockedCount = Math.max(0, gmailLockedTotal - gmailLockedRemaining);
  const unlockProgressPercent = pdfLocked
    ? PERCENTAGE_THRESHOLDS.MIN
    : gmailLockedTotal > 0
      ? (gmailUnlockedCount / gmailLockedTotal) * PERCENTAGE_THRESHOLDS.MAX
      : PERCENTAGE_THRESHOLDS.MIN;
  const unlockWaitingCount = pdfLocked ? 1 : gmailLockedRemaining;
  const unlockProgressUnlocked = pdfLocked ? 0 : gmailUnlockedCount;
  const unlockProgressTotal = pdfLocked ? 1 : gmailLockedTotal;
  const activeStep: ImportStep = importing || importedCount > 0 ? 3 : staging.length > 0 || showUnlockPanel ? 2 : 1;

  const persistDiscoveredCategories = useCallback(
    (discovered: DiscoveredCategories | undefined) => {
      if (!userId) return;
      const income = discovered?.income ?? [];
      const expense = discovered?.expense ?? [];
      const count = income.length + expense.length;
      if (count === 0) return;
      const createdAt = new Date().toISOString();
      const existing = new Set(catalog.map((c) => `${c.type}:${c.name.toLowerCase()}`));
      const toAdd = [
        ...income
          .filter((name) => !existing.has(`income:${name.toLowerCase()}`))
          .map((name) => ({
            userId,
            name,
            type: "income" as const,
            color: DEFAULT_CATEGORY_COLOR,
            isDefault: false,
            createdAt,
          })),
        ...expense
          .filter((name) => !existing.has(`expense:${name.toLowerCase()}`))
          .map((name) => ({
            userId,
            name,
            type: "expense" as const,
            color: DEFAULT_CATEGORY_COLOR,
            isDefault: false,
            createdAt,
          })),
      ];
      if (toAdd.length === 0) return;
      void dispatch(addCategoriesBulk(toAdd));
      showInfo(UI_TEXT.IMPORT_NEW_CATEGORIES_ADDED.replace("{count}", String(toAdd.length)));
    },
    [catalog, dispatch, userId],
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

  const resetStaging = useCallback(() => {
    // Never clear mid-stream — wiping sessionStorage while batches are in flight
    // would let the runner re-persist a zombie job and race UI state.
    if (importInFlightRef.current) {
      showError(IMPORT_STREAM_UI.BUSY_DISCARD);
      return;
    }
    setStaging([]);
    setFile(null);
    setParsing(false);
    setImporting(false);
    setImportProgress(null);
    setStreamJobSnapshot(null);
    activeStreamJobRef.current = null;
    setParseError(null);
    setPdfLocked(false);
    setPdfPassword("");
    setPdfPasswordError(null);
    setUnlockingGmail(false);
    lastFailedFileRef.current = null;
    setCanRetryParse(false);
    if (userId) {
      clearReviewStaging(userId);
      clearImportStreamJob(userId);
    }
    if (inputRef.current) inputRef.current.value = "";
  }, [userId]);

  const resetImport = useCallback(() => {
    resetStaging();
    if (userId) {
      clearLockedQueue(userId);
      clearReviewStaging(userId);
    }
    setGmailLockedQueue([]);
    setInitialLockedTotal(0);
    prevGmailLockedCountRef.current = 0;
  }, [resetStaging, userId]);

  const applyStaging = useCallback(
    (rows: StagingRow[], sourceName?: string) => {
      const named = sourceName
        ? attachSourceToRows(rows, {
            id: `local:${sourceName}`,
            name: sourceName,
          })
        : rows;
      setStaging(withDuplicatesUnchecked(named, transactions));
    },
    [transactions],
  );

  const catalogLists = useMemo(
    () => ({
      income: catalog.filter((c) => c.type === "income").map((c) => c.name),
      expense: catalog.filter((c) => c.type === "expense").map((c) => c.name),
    }),
    [catalog],
  );

  const parseViaApi = useCallback(
    async (selected: File, password?: string) => {
      const form = new FormData();
      form.append(STATEMENT_IMPORT.FIELD_NAME, selected);
      if (password?.trim()) {
        form.append(STATEMENT_IMPORT.PASSWORD_FIELD_NAME, password.trim());
      }

      const res = await authedFetch("/api/parse-statement", {
        method: "POST",
        body: form,
      });

      const data = (await res.json()) as {
        transactions?: ParsedStatementTransaction[];
        meta?: { discoveredCategories?: DiscoveredCategories };
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        const mapped = mapStatementApiError(res.status, data, ERROR_MESSAGES.PARSE_STATEMENT_FAILED);
        const err = new Error(mapped.message) as Error & { code?: string };
        if (mapped.kind === "pdf_password" && mapped.code) {
          err.code = mapped.code;
        }
        throw err;
      }

      if (!data.transactions?.length) {
        throw new Error(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS);
      }

      const { rows, discovered: enrichedDiscovered } = await enrichStagingCategoriesWithAi(
        parsedToStaging(data.transactions),
        { income: catalogLists.income, expense: catalogLists.expense },
        rules,
      );
      const discovered =
        data.meta?.discoveredCategories ??
        enrichedDiscovered ??
        collectNovelCategories(rows, {
          income: catalogLists.income,
          expense: catalogLists.expense,
        });
      return { rows, discovered };
    },
    [catalogLists.expense, catalogLists.income, rules],
  );

  const isPdfPasswordError = useCallback((err: unknown): err is Error & { code: string } => {
    if (!(err instanceof Error)) return false;
    const code = (err as Error & { code?: string }).code;
    return (
      code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.REQUIRED || code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT
    );
  }, []);

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
        income: catalogLists.income,
        expense: catalogLists.expense,
      };
      return enrichStagingCategoriesWithAi(stagingRows, existing, rules);
    },
    [catalogLists.expense, catalogLists.income, rules],
  );

  const handleFile = useCallback(
    async (selected: File, password?: string) => {
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
      setParseError(null);
      setPdfPasswordError(null);
      if (!password) {
        setPdfLocked(false);
        setPdfPassword("");
      }
      lastFailedFileRef.current = selected;
      setCanRetryParse(true);

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
          showInfo(password ? UI_TEXT.IMPORT_PDF_UNLOCKING : UI_TEXT.IMPORT_PARSING);
          const result = await parseViaApi(selected, password);
          rows = result.rows;
          discovered = result.discovered;
        }

        persistDiscoveredCategories(discovered);
        applyStaging(rows, selected.name);
        lastFailedFileRef.current = null;
        setCanRetryParse(false);
        setPdfLocked(false);
        setPdfPassword("");
        setPdfPasswordError(null);
      } catch (err) {
        if (isPdfPasswordError(err)) {
          setPdfLocked(true);
          setParseError(null);
          setPdfPasswordError(
            err.code === STATEMENT_IMPORT.PDF_PASSWORD_CODES.INCORRECT
              ? ERROR_MESSAGES.PDF_PASSWORD_INCORRECT
              : ERROR_MESSAGES.PDF_PASSWORD_REQUIRED,
          );
          setCanRetryParse(true);
          return;
        }

        const message = err instanceof Error && err.message ? err.message : ERROR_MESSAGES.PARSE_STATEMENT_FAILED;
        setParseError(message);
        showError(message);
        setFile(null);
        setPdfLocked(false);
      } finally {
        setParsing(false);
      }
    },
    [applyStaging, isPdfPasswordError, parseExcelClient, parseViaApi, persistDiscoveredCategories],
  );

  const handleUnlockPdf = useCallback(() => {
    const lockedFile = lastFailedFileRef.current ?? file;
    if (!lockedFile) return;
    if (!pdfPassword.trim()) {
      setPdfPasswordError(ERROR_MESSAGES.PDF_PASSWORD_REQUIRED);
      return;
    }
    void handleFile(lockedFile, pdfPassword);
  }, [file, handleFile, pdfPassword]);

  const appendStagingRows = useCallback(
    (rows: StagingRow[]) => {
      const withSource = rows.map((row) =>
        row.sourceFileId
          ? row
          : {
              ...row,
              sourceFileId: IMPORT_STREAM.FALLBACK_FILE_ID,
              sourceFileName: IMPORT_STREAM.FALLBACK_FILE_NAME,
            },
      );
      setStaging((prev) => withDuplicatesUnchecked([...prev, ...withSource], transactions));
    },
    [transactions],
  );

  /** Hydrate session review queue (auto-sync / cross-route handoff) into the staging table. */
  useEffect(() => {
    if (!userId) return;

    let hydrating = false;

    const hydrateReviewQueue = () => {
      if (hydrating) return;
      // Peek first so concurrent focus/visibility events cannot drain a partial write mid-merge.
      if (readReviewStaging(userId).length === 0) return;

      hydrating = true;
      const pending = takeReviewStaging(userId);
      if (pending.length === 0) {
        hydrating = false;
        return;
      }

      shouldScrollToPreviewRef.current = true;
      void enrichStagingCategoriesWithAi(pending, { income: catalogLists.income, expense: catalogLists.expense }, rules)
        .then(({ rows, discovered }) => {
          appendStagingRows(rows);
          persistDiscoveredCategories(discovered);
        })
        .catch(() => {
          appendStagingRows(pending);
        })
        .finally(() => {
          hydrating = false;
        });
    };

    hydrateReviewQueue();

    const onReviewChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      hydrateReviewQueue();
    };

    const onVisible = () => {
      if (document.visibilityState === GMAIL_DEFAULTS.DOCUMENT_VISIBLE_STATE) hydrateReviewQueue();
    };

    window.addEventListener(GMAIL_DEFAULTS.REVIEW_QUEUE_CHANGED_EVENT, onReviewChanged);
    window.addEventListener(GMAIL_DEFAULTS.WINDOW_FOCUS_EVENT, hydrateReviewQueue);
    document.addEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onVisible);
    return () => {
      window.removeEventListener(GMAIL_DEFAULTS.REVIEW_QUEUE_CHANGED_EVENT, onReviewChanged);
      window.removeEventListener(GMAIL_DEFAULTS.WINDOW_FOCUS_EVENT, hydrateReviewQueue);
      document.removeEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onVisible);
    };
  }, [appendStagingRows, catalogLists.expense, catalogLists.income, persistDiscoveredCategories, rules, userId]);

  const unlockInFlightRef = useRef(false);

  const handleUnlockGmailAttachment = useCallback(async () => {
    if (!userId || !activeGmailLocked) return;
    if (unlockInFlightRef.current) return;
    if (!pdfPassword.trim()) {
      setPdfPasswordError(ERROR_MESSAGES.PDF_PASSWORD_REQUIRED);
      return;
    }

    unlockInFlightRef.current = true;
    setUnlockingGmail(true);
    setPdfPasswordError(null);
    showInfo(UI_TEXT.IMPORT_PDF_UNLOCKING);

    try {
      const res = await authedFetch("/api/gmail/unlock-attachment", {
        method: "POST",
        body: JSON.stringify({
          userId,
          messageId: activeGmailLocked.messageId,
          attachmentId: activeGmailLocked.attachmentId,
          filename: activeGmailLocked.filename,
          pdfPassword: pdfPassword.trim(),
        }),
      });

      const data = (await res.json()) as {
        transactions?: ParsedStatementTransaction[];
        meta?: { discoveredCategories?: DiscoveredCategories };
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        const mapped = mapStatementApiError(res.status, data, GMAIL_ERROR_MESSAGES.UNLOCK_ATTACHMENT_FAILED);
        if (mapped.kind === "pdf_password") {
          setPdfPasswordError(mapped.message);
          return;
        }
        // Auth 401 / UNAUTHORIZED — never show incorrect-password copy.
        setPdfPasswordError(mapped.message);
        showError(mapped.message);
        return;
      }

      if (!data.transactions?.length) {
        throw new Error(ERROR_MESSAGES.STATEMENT_NO_TRANSACTIONS);
      }

      const { rows, discovered } = await enrichStagingCategoriesWithAi(
        parsedToStaging(data.transactions),
        { income: catalogLists.income, expense: catalogLists.expense },
        rules,
      );
      const sourced = attachSourceToRows(rows, {
        id: `gmail:${activeGmailLocked.messageId}:${activeGmailLocked.attachmentId}`,
        name: activeGmailLocked.filename || IMPORT_STREAM.FALLBACK_FILE_NAME,
        messageId: activeGmailLocked.messageId,
        attachmentId: activeGmailLocked.attachmentId,
      });
      shouldScrollToPreviewRef.current = true;
      appendStagingRows(sourced);
      // Prefer AI-enriched discoveries from staging; skip duplicate meta persist.
      persistDiscoveredCategories(discovered);

      const nextQueue = removeLockedItem(userId, activeGmailLocked.id);
      setGmailLockedQueue(nextQueue);
      setPdfPassword("");
      setPdfPasswordError(null);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : GMAIL_ERROR_MESSAGES.UNLOCK_ATTACHMENT_FAILED;
      setPdfPasswordError(message);
      showError(message);
    } finally {
      unlockInFlightRef.current = false;
      setUnlockingGmail(false);
    }
  }, [
    activeGmailLocked,
    appendStagingRows,
    catalogLists.expense,
    catalogLists.income,
    pdfPassword,
    persistDiscoveredCategories,
    rules,
    userId,
  ]);

  const handleSkipGmailLocked = useCallback(() => {
    if (!userId || !activeGmailLocked) return;
    const skippedName = activeGmailLocked.filename || IMPORT_STREAM.FALLBACK_FILE_NAME;
    const nextQueue = removeLockedItem(userId, activeGmailLocked.id);
    setGmailLockedQueue(nextQueue);
    setPdfPassword("");
    setPdfPasswordError(null);
    showInfo(IMPORT_STREAM_UI.FILE_FAILURE_BANNER.replace("{count}", "1").replace("{names}", skippedName));
  }, [activeGmailLocked, userId]);

  const handleUnlockSubmit = useCallback(() => {
    if (pdfLocked) {
      handleUnlockPdf();
      return;
    }
    void handleUnlockGmailAttachment();
  }, [handleUnlockGmailAttachment, handleUnlockPdf, pdfLocked]);

  const handleGmailTransactions = useCallback(
    (parsed: ParsedStatementTransaction[], meta: GmailSyncResponse["meta"]) => {
      setFile(null);
      setParseError(null);
      setPdfLocked(false);
      setPdfPassword("");
      setPdfPasswordError(null);

      const locked = meta.lockedAttachments ?? [];
      if (userId && locked.length > 0) {
        setGmailLockedQueue(mergeLockedQueue(userId, locked));
      } else if (userId) {
        setGmailLockedQueue(readLockedQueue(userId));
      }

      if (parsed.length > 0) {
        shouldScrollToPreviewRef.current = true;
        // Same AI/keyword enrichment as Excel import — Gmail alerts often land as Other.
        void enrichStagingCategoriesWithAi(
          parsedToStaging(parsed),
          { income: catalogLists.income, expense: catalogLists.expense },
          rules,
        ).then(({ rows, discovered }) => {
          appendStagingRows(
            attachSourceToRows(rows, {
              id: `gmail:sync:${Date.now()}`,
              name: GMAIL_UI_TEXT.SECTION_AUTOMATION,
            }),
          );
          persistDiscoveredCategories(discovered);
          if (meta.discoveredCategories) {
            persistDiscoveredCategories(meta.discoveredCategories);
          }
        });
      } else if (meta.discoveredCategories) {
        persistDiscoveredCategories(meta.discoveredCategories);
      }
    },
    [appendStagingRows, catalogLists.expense, catalogLists.income, persistDiscoveredCategories, rules, userId],
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

  const handleRowChange = useCallback((key: string, patch: Partial<StagingRow>) => {
    setStaging((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch, userOverridden: true } : row)));
  }, []);

  const finishStreamResult = useCallback(
    (result: Awaited<ReturnType<typeof runImportStream>>, selectedDupCount: number) => {
      const { job, savedIds, fullySuccessful } = result;
      const counts = countRecordsByStatus(job);
      setStreamJobSnapshot(job);
      setImportProgress(counts);
      activeStreamJobRef.current = job;

      if (savedIds.length > 0) {
        setLastImportBatchIds(savedIds);
        setImportedCount(counts.importedRecords);
        const focusRows = job.rows
          .filter((row) => job.records[row.key]?.status === IMPORT_RECORD_STATUS.IMPORTED)
          .map(
            (row) =>
              ({
                id: row.key,
                date: row.date,
                amount: row.amount,
                type: row.type,
                title: row.title,
              }) as Transaction,
          );
        focusUiOnImported(dispatch, focusRows);
      }

      if (fullySuccessful) {
        resetStaging();
        if (selectedDupCount > 0) {
          showSuccess(
            UI_TEXT.IMPORT_SUCCESS_WITH_DUPLICATES.replace("{count}", String(counts.importedRecords)).replace(
              "{duplicates}",
              String(selectedDupCount),
            ),
          );
        } else {
          showSuccess(UI_TEXT.IMPORT_SUCCESS_COUNT.replace("{count}", String(counts.importedRecords)));
        }
        window.setTimeout(() => setImportedCount(0), TIMEOUTS.IMPORT_SUCCESS);
        return;
      }

      if (job.lastError === IMPORT_STREAM.PERSIST_FAILED_REASON) {
        showError(IMPORT_STREAM_UI.PERSIST_FAILED);
        // Mid-stream interrupt: persist warning is enough. After completed_with_errors, keep banners.
        if (job.status === IMPORT_JOB_STATUS.INTERRUPTED) return;
      }

      const failedFiles = listFailedFileNames(job);
      const failedSamples = listFailedRecordSamples(job);

      if (counts.pendingRecords > 0) {
        showError(IMPORT_STREAM_UI.COMPLETE_GATE_BLOCKED.replace("{pending}", String(counts.pendingRecords)));
      } else if (counts.failedRecords > 0) {
        showError(
          IMPORT_STREAM_UI.PARTIAL_FAILURE.replace("{imported}", String(counts.importedRecords))
            .replace("{rows}", String(counts.totalRecords))
            .replace("{failed}", String(counts.failedRecords))
            .replace("{skipped}", String(counts.skippedRecords))
            .replace("{sample}", failedSamples.join(", ") || "—"),
        );
      }

      if (failedFiles.length > 0) {
        showInfo(
          IMPORT_STREAM_UI.FILE_FAILURE_BANNER.replace("{count}", String(failedFiles.length)).replace(
            "{names}",
            failedFiles.join(", "),
          ),
        );
      }

      if (counts.failedRecords > 0 && failedSamples.length > 0) {
        showInfo(
          IMPORT_STREAM_UI.RECORD_FAILURE_BANNER.replace("{count}", String(counts.failedRecords)).replace(
            "{sample}",
            failedSamples.join(", "),
          ),
        );
      }
    },
    [dispatch, resetStaging],
  );

  const executeImportStream = useCallback(
    async (job: ImportStreamJob, selectedDupCount: number) => {
      if (!userId || importInFlightRef.current) return;
      if (job.userId !== userId) {
        showError(ERROR_MESSAGES.IMPORT_USER_MISMATCH);
        return;
      }
      importInFlightRef.current = true;
      setImporting(true);
      activeStreamJobRef.current = job;
      setStreamJobSnapshot(job);
      setImportProgress(countRecordsByStatus(job));

      try {
        const result = await runImportStream(job, {
          commitBatch: async (items) => dispatch(addTransactionsBulk(items)).unwrap(),
          onProgress: (progress, liveJob) => {
            activeStreamJobRef.current = liveJob;
            setStreamJobSnapshot(liveJob);
            setImportProgress(progress);
          },
        });
        // Release before finishStreamResult so full-success resetStaging is not blocked.
        importInFlightRef.current = false;
        finishStreamResult(result, selectedDupCount);
      } catch (err) {
        const raw =
          typeof err === "string"
            ? err
            : err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message || "")
              : "";
        const message = /permission|insufficient/i.test(raw)
          ? ERROR_MESSAGES.IMPORT_FIRESTORE_BLOCKED
          : raw || ERROR_MESSAGES.SAVE_FAILED;
        const interrupted = markJobInterrupted(activeStreamJobRef.current || job);
        if (!writeImportStreamJob(userId, interrupted)) {
          showInfo(IMPORT_STREAM_UI.PERSIST_FAILED);
        }
        activeStreamJobRef.current = interrupted;
        setStreamJobSnapshot(interrupted);
        setImportProgress(countRecordsByStatus(interrupted));
        showError(message);
      } finally {
        importInFlightRef.current = false;
        setImporting(false);
      }
    },
    [dispatch, finishStreamResult, userId],
  );

  const handleImport = async () => {
    if (!userId) {
      showError(ERROR_MESSAGES.IMPORT_REQUIRES_SIGN_IN);
      return;
    }

    const selected = staging.filter((r) => r.selected);
    if (selected.length === 0) {
      showError(UI_TEXT.IMPORT_NONE_SELECTED);
      return;
    }

    const selectedKeys = selected.map((r) => r.key);
    const fingerprint = buildImportFingerprint(selectedKeys);
    // Prefer live snapshot over sessionStorage when persist failed mid-stream (stale resume map).
    const existing = preferFresherImportJob(streamJobSnapshot, readImportStreamJob(userId));
    // Only auto-resume when the pending job matches the current selection fingerprint.
    if (existing && jobHasRetryableWork(existing) && existing.fingerprint === fingerprint) {
      showInfo(
        IMPORT_STREAM_UI.RESUMING.replace("{current}", String(existing.completedBatches + 1)).replace(
          "{total}",
          String(Math.max(existing.totalBatches, 1)),
        ),
      );
      await executeImportStream(existing, selected.filter((r) => duplicateKeys.has(r.key)).length);
      return;
    }

    // Account for every staging row: selected → pending, deselected → skipped (flagged).
    const job = createImportStreamJob(userId, staging);
    // Persist best-effort; runImportStream + finishStreamResult warn if resume map is not durable.
    if (!writeImportStreamJob(userId, job)) {
      showInfo(IMPORT_STREAM_UI.PERSIST_FAILED);
    }
    const selectedDupCount = selected.filter((r) => duplicateKeys.has(r.key)).length;
    await executeImportStream(job, selectedDupCount);
  };

  const handleRetryFailedImport = useCallback(async () => {
    if (!userId) return;
    const job = preferFresherImportJob(streamJobSnapshot, readImportStreamJob(userId));
    if (!job || !jobHasRetryableWork(job)) {
      showError(UI_TEXT.IMPORT_NONE_SELECTED);
      return;
    }
    showInfo(
      IMPORT_STREAM_UI.RESUMING.replace("{current}", String(job.completedBatches + 1)).replace(
        "{total}",
        String(Math.max(job.totalBatches, 1)),
      ),
    );
    await executeImportStream(job, 0);
  }, [executeImportStream, streamJobSnapshot, userId]);

  /** Auto-resume interrupted streaming imports; persist interrupt on page hide. */
  useEffect(() => {
    if (!userId) return;

    const existing = readImportStreamJob(userId);
    if (
      existing &&
      jobHasRetryableWork(existing) &&
      (existing.status === IMPORT_JOB_STATUS.INTERRUPTED ||
        existing.status === IMPORT_JOB_STATUS.FAILED ||
        existing.status === IMPORT_JOB_STATUS.STREAMING)
    ) {
      setStreamJobSnapshot(existing);
      setImportProgress(countRecordsByStatus(existing));
      showInfo(
        IMPORT_STREAM_UI.RESUMING.replace("{current}", String(existing.completedBatches + 1)).replace(
          "{total}",
          String(Math.max(existing.totalBatches, 1)),
        ),
      );
      void executeImportStream(existing, 0);
    } else if (existing) {
      setStreamJobSnapshot(existing);
      setImportProgress(countRecordsByStatus(existing));
    }

    const onHide = () => {
      if (document.visibilityState === GMAIL_DEFAULTS.DOCUMENT_VISIBLE_STATE) return;
      const live = activeStreamJobRef.current;
      if (!live || !importInFlightRef.current) return;
      const interrupted = interruptImportStream(live);
      activeStreamJobRef.current = interrupted;
      setStreamJobSnapshot(interrupted);
    };

    document.addEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener(GMAIL_DEFAULTS.DOCUMENT_VISIBILITY_EVENT, onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // One-shot resume per signed-in user; avoid re-firing on callback identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [userId]);

  const confirmCleanup = async () => {
    if (!userId) return;
    const count = importedTransactionsCount;
    try {
      await dispatch(deleteImportedTransactions(userId)).unwrap();
      setLastImportBatchIds([]);
      showSuccess(UI_TEXT.CLEANUP_SUCCESS.replace("{count}", count.toString()));
    } catch {
      showError(ERROR_MESSAGES.SAVE_FAILED);
    } finally {
      setShowCleanupDialog(false);
    }
  };

  const handleUndoLastImport = async () => {
    if (!lastImportBatchIds.length) return;
    try {
      const removed = await dispatch(deleteTransactionsByIds(lastImportBatchIds)).unwrap();
      setLastImportBatchIds([]);
      setImportedCount(0);
      showSuccess(UI_TEXT.IMPORT_UNDO_SUCCESS.replace("{count}", String(removed.length)));
    } catch {
      showError(ERROR_MESSAGES.SAVE_FAILED);
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

      <section className="space-y-2" aria-labelledby="import-automation-heading">
        <div>
          <h2 id="import-automation-heading" className="text-sm font-semibold text-brand-deep">
            {GMAIL_UI_TEXT.SECTION_AUTOMATION}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">{GMAIL_UI_TEXT.SECTION_AUTOMATION_HINT}</p>
        </div>
        <GmailSyncPanel onTransactionsFetched={handleGmailTransactions} />
      </section>

      {importedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:text-income sm:flex-row sm:items-center sm:justify-between">
          <span>{UI_TEXT.IMPORT_SUCCESS_COUNT.replace("{count}", String(importedCount))}</span>
          <div className="flex flex-wrap gap-2">
            {lastImportBatchIds.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => void handleUndoLastImport()}>
                {UI_TEXT.IMPORT_UNDO_LAST}
              </Button>
            )}
            {onClose && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {UI_TEXT.DONE}
              </Button>
            )}
          </div>
        </div>
      )}

      {parseError && !parsing && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="font-semibold">{UI_TEXT.IMPORT_PARSE_ERROR_TITLE}</p>
              <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">{parseError}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canRetryParse}
              onClick={() => {
                const retry = lastFailedFileRef.current;
                if (retry) void handleFile(retry);
              }}
            >
              {UI_TEXT.IMPORT_PARSE_RETRY}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setParseError(null);
                inputRef.current?.click();
              }}
            >
              {UI_TEXT.IMPORT_PARSE_CHOOSE_ANOTHER}
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-2" aria-labelledby="import-manual-heading">
        <div>
          <h2 id="import-manual-heading" className="text-sm font-semibold text-brand-deep">
            {GMAIL_UI_TEXT.SECTION_MANUAL}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">{GMAIL_UI_TEXT.SECTION_MANUAL_HINT}</p>
        </div>
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
            (parsing || parseProgress.visible) && "pointer-events-none opacity-70",
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
          {parseProgress.visible ? (
            <div className="mx-auto w-full max-w-sm px-2">
              <ProgressPercent
                value={parseProgress.percent}
                label={parseProgress.label || UI_TEXT.IMPORT_PARSING}
                ariaLabel={UI_TEXT.IMPORT_PROGRESS_ARIA}
              />
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
      </section>

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

      {/* Password-locked PDF — unlock in Review (manual upload and/or Gmail queue) */}
      {showUnlockPanel && (
        <section
          ref={unlockPanelRef}
          className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-card dark:border-amber-500/30 dark:bg-card"
          aria-labelledby="import-pdf-locked-heading"
        >
          <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/80 px-4 py-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2
              id="import-pdf-locked-heading"
              className="flex items-center gap-2 text-lg font-semibold text-brand-deep"
            >
              <ShieldLockIcon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              {UI_TEXT.IMPORT_PDF_LOCKED_TITLE}
            </h2>
            <div className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
              {pdfLocked && file ? (
                <span className="truncate text-xs font-medium text-gray-500 sm:max-w-70 sm:text-sm">{file.name}</span>
              ) : null}
              {!pdfLocked && activeGmailLocked ? (
                <>
                  <div className="flex flex-wrap items-center justify-start gap-1.5 sm:justify-end">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      {GMAIL_UI_TEXT.IMPORT_GMAIL_FROM_LABEL}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary-main/10 px-2 py-0.5 text-[11px] font-semibold text-primary-main dark:bg-primary-main/20 dark:text-primary-light">
                      {activeGmailLocked.bankLabel || GMAIL_UI_TEXT.IMPORT_GMAIL_BANK_LABEL_FALLBACK}
                    </span>
                  </div>
                  <span className="truncate text-xs font-medium text-gray-500 sm:max-w-70 sm:text-sm">
                    {activeGmailLocked.filename}
                  </span>
                </>
              ) : null}
              <span className="text-[11px] font-medium text-amber-800/80 dark:text-amber-200/80">
                {(pdfLocked ? UI_TEXT.IMPORT_PDF_LOCKED_WAITING : GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_WAITING).replace(
                  "{count}",
                  String(unlockWaitingCount),
                )}
              </span>
            </div>
          </div>

          <div className="space-y-4 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-600 dark:text-on-surface-variant">
              {pdfLocked ? UI_TEXT.IMPORT_PDF_LOCKED_BODY : GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_BODY}
            </p>

            <ProgressPercent
              value={unlockProgressPercent}
              label={(pdfLocked ? UI_TEXT.IMPORT_PDF_LOCKED_PROGRESS : GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_PROGRESS)
                .replace("{unlocked}", String(unlockProgressUnlocked))
                .replace("{total}", String(unlockProgressTotal))}
              ariaLabel={
                pdfLocked ? UI_TEXT.IMPORT_PDF_LOCKED_PROGRESS_ARIA : GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_PROGRESS_ARIA
              }
              className="max-w-md"
            />

            {!pdfLocked && gmailLockedQueue.length > 1 ? (
              <ul className="flex max-w-md flex-wrap gap-1.5" aria-label={GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_QUEUE_ARIA}>
                {gmailLockedQueue.map((item, index) => (
                  <li
                    key={item.id}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[11px] font-medium",
                      index === 0
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100"
                        : "bg-surface-low text-gray-500 dark:text-on-surface-variant",
                    )}
                  >
                    <span className="shrink-0 font-semibold text-primary-main dark:text-primary-light">
                      {item.bankLabel || GMAIL_UI_TEXT.IMPORT_GMAIL_BANK_LABEL_FALLBACK}
                    </span>
                    <span className="truncate">{item.filename}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="max-w-md space-y-2">
              <label htmlFor="import-pdf-password" className="block text-sm font-semibold text-brand-deep">
                {UI_TEXT.IMPORT_PDF_PASSWORD_LABEL}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="import-pdf-password"
                    type="password"
                    autoComplete="off"
                    value={pdfPassword}
                    disabled={parsing || unlockingGmail}
                    placeholder={UI_TEXT.IMPORT_PDF_PASSWORD_PLACEHOLDER}
                    onChange={(e) => {
                      setPdfPassword(e.target.value);
                      if (pdfPasswordError) setPdfPasswordError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUnlockSubmit();
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-outline-variant bg-surface-low pl-9 pr-3 text-sm text-brand-deep outline-none ring-primary-main/30 placeholder:text-gray-400 focus:ring-2 disabled:opacity-60"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={parsing || unlockingGmail}
                  disabled={parsing || unlockingGmail || !pdfPassword.trim()}
                  onClick={handleUnlockSubmit}
                  className="sm:min-w-35"
                >
                  {UI_TEXT.IMPORT_PDF_UNLOCK}
                </Button>
              </div>
              {!pdfLocked && activeGmailLocked ? (
                <p className="text-xs leading-relaxed text-gray-500 dark:text-on-surface-variant">
                  <span className="font-semibold text-brand-deep/80 dark:text-on-surface">
                    {GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_LABEL}:{" "}
                  </span>
                  {activeGmailLocked.passwordHint || GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK}
                </p>
              ) : null}
              {pdfPasswordError ? (
                <p role="alert" className="text-sm text-expense">
                  {pdfPasswordError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {pdfLocked ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={parsing || importing}
                    onClick={resetStaging}
                  >
                    {UI_TEXT.IMPORT_DISCARD_ALL}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={parsing}
                    onClick={() => {
                      setPdfLocked(false);
                      setPdfPassword("");
                      setPdfPasswordError(null);
                      setFile(null);
                      lastFailedFileRef.current = null;
                      inputRef.current?.click();
                    }}
                  >
                    {UI_TEXT.IMPORT_PARSE_CHOOSE_ANOTHER}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={unlockingGmail}
                  onClick={handleSkipGmailLocked}
                >
                  {GMAIL_UI_TEXT.IMPORT_GMAIL_LOCKED_SKIP}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Preview */}
      {staging.length > 0 && (
        <section ref={previewRef} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card">
          <div
            role="status"
            className="border-b border-primary-main/15 bg-primary-main/5 px-4 py-3 text-sm font-semibold text-brand-deep sm:px-6"
          >
            {UI_TEXT.IMPORT_READY_TO_REVIEW.replace("{count}", String(staging.length))}
          </div>
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

          {aiDuplicateCount > 0 ? (
            <div
              role="status"
              className="flex items-start gap-3 border-b border-sky-200/80 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100 sm:px-6"
            >
              <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-300" />
              <p className="font-medium">
                {selectedAiDuplicateCount > 0
                  ? UI_TEXT.IMPORT_AI_DUPLICATE_BANNER.replace("{count}", String(aiDuplicateCount)).replace(
                      "{selected}",
                      String(selectedAiDuplicateCount),
                    )
                  : UI_TEXT.IMPORT_AI_DUPLICATE_BANNER_NONE_SELECTED.replace("{count}", String(aiDuplicateCount))}
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
                    onRowChange={handleRowChange}
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
                onRowChange={handleRowChange}
                variant="card"
              />
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
            {(importing || importProgress) && importProgress ? (
              <div className="w-full space-y-2">
                <ProgressPercent
                  value={importProgress.percent}
                  label={IMPORT_STREAM_UI.PROGRESS.replace(
                    "{current}",
                    String(
                      Math.min(importProgress.completedBatches + (importing ? 1 : 0), importProgress.totalBatches),
                    ),
                  )
                    .replace("{total}", String(importProgress.totalBatches))
                    .replace("{imported}", String(importProgress.importedRecords))
                    .replace("{rows}", String(importProgress.totalRecords))}
                  ariaLabel={IMPORT_STREAM_UI.PROGRESS_ARIA}
                />
                <p className="text-xs text-gray-500">
                  {IMPORT_STREAM_UI.RECORDS_SUMMARY.replace("{imported}", String(importProgress.importedRecords))
                    .replace("{failed}", String(importProgress.failedRecords))
                    .replace("{skipped}", String(importProgress.skippedRecords))
                    .replace("{pending}", String(importProgress.pendingRecords))}
                </p>
                {streamJobSnapshot ? (
                  <p className="text-xs text-gray-500">
                    {IMPORT_STREAM_UI.FILES_SUMMARY.replace(
                      "{imported}",
                      String(streamJobSnapshot.files.filter((f) => f.status === IMPORT_FILE_STATUS.IMPORTED).length),
                    )
                      .replace(
                        "{failed}",
                        String(streamJobSnapshot.files.filter((f) => f.status === IMPORT_FILE_STATUS.FAILED).length),
                      )
                      .replace(
                        "{skipped}",
                        String(streamJobSnapshot.files.filter((f) => f.status === IMPORT_FILE_STATUS.SKIPPED).length),
                      )
                      .replace(
                        "{pending}",
                        String(
                          streamJobSnapshot.files.filter(
                            (f) => f.status === IMPORT_FILE_STATUS.PENDING || f.status === IMPORT_FILE_STATUS.IMPORTING,
                          ).length,
                        ),
                      )}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-main/10 text-primary-main">
                  <BoltIcon className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-gray-500 sm:text-sm">
                  {UI_TEXT.IMPORT_AI_SUGGESTED.replace("{pct}", String(categorizedPct))}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Button onClick={resetImport} variant="ghost" disabled={importing} className="sm:min-w-30">
                  {UI_TEXT.IMPORT_DISCARD_ALL}
                </Button>
                {streamJobSnapshot &&
                !importing &&
                jobHasRetryableWork(streamJobSnapshot) &&
                (streamJobSnapshot.status === IMPORT_JOB_STATUS.FAILED ||
                  streamJobSnapshot.status === IMPORT_JOB_STATUS.INTERRUPTED ||
                  streamJobSnapshot.status === IMPORT_JOB_STATUS.COMPLETED_WITH_ERRORS) ? (
                  <Button onClick={() => void handleRetryFailedImport()} variant="primary" className="sm:min-w-40">
                    {IMPORT_STREAM_UI.RETRY_FAILED.replace(
                      "{count}",
                      String(importProgress?.failedRecords || importProgress?.pendingRecords || 0),
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => void handleImport()}
                    variant="primary"
                    loading={importing}
                    className="sm:min-w-40"
                  >
                    {UI_TEXT.IMPORT_ITEMS.replace("{count}", String(selectedCount))}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Info cards */}
      {staging.length === 0 && !parsing && !showUnlockPanel && (
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
        message={`${UI_TEXT.CONFIRM_CLEANUP_IMPORTED} ${UI_TEXT.CONFIRM_CLEANUP_IMPORTED_COUNT.replace("{count}", String(importedTransactionsCount))}`}
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
