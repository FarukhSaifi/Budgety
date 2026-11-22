"use client";

import { useState } from "react";

import {
  GMAIL_AUTO_SYNC_INTERVALS,
  GMAIL_DATE_PRESETS,
  GMAIL_DEFAULTS,
  GMAIL_ERROR_MESSAGES,
  GMAIL_SYNC_PROGRESS_STAGES,
  GMAIL_UI_TEXT,
} from "@constants";

import { Button } from "@components/common/Button";
import { ProgressPercent } from "@components/common/ProgressPercent";
import { Spinner } from "@components/common/Spinner";
import { CheckCircleIcon, CloseIcon, CloudUploadIcon, RefreshIcon, WarningIcon } from "@components/icons";

import { useEstimatedProgress } from "@hooks/useEstimatedProgress";
import { useGmailIntegration } from "@hooks/useGmailIntegration";
import { useAppSelector } from "@store/hooks";
import { showError } from "@utils/toast";

import type { GmailSyncPanelProps } from "./GmailSyncPanel.types";

/**
 * Manual / on-demand Gmail sync into the shared import staging table.
 * Background auto-sync lives in `useGmailAutoSync` (AppShell) so it is not duplicated here.
 */
export function GmailSyncPanel({ onTransactionsFetched }: GmailSyncPanelProps) {
  const userId = useAppSelector((s) => s.auth.user?.uid) || GMAIL_DEFAULTS.DEFAULT_USER_ID;
  const existingTransactions = useAppSelector((s) => s.transactions.items);

  const {
    status,
    isConfigured,
    loading: checkingStatus,
    syncing,
    syncSummary,
    setSyncSummary,
    connectGmail,
    disconnectGmail,
    updateAutoSync,
    syncGmail,
  } = useGmailIntegration(userId);

  const syncProgress = useEstimatedProgress(syncing, { stages: GMAIL_SYNC_PROGRESS_STAGES });

  const [showOptions, setShowOptions] = useState(false);
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [daysBack, setDaysBack] = useState<number>(GMAIL_DEFAULTS.DAYS_BACK);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);

  const setMonthRange = (offsetMonths: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() - offsetMonths;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    setStartDate(fmt(start));
    setEndDate(fmt(end));
    setRangeMode("custom");
  };

  const handleSync = () => {
    if (rangeMode === "custom") {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showError(GMAIL_ERROR_MESSAGES.INVALID_DATE_RANGE);
        return;
      }
    }

    void syncGmail(
      {
        daysBack: rangeMode === "preset" ? daysBack : undefined,
        startDate: rangeMode === "custom" && startDate ? startDate : undefined,
        endDate: rangeMode === "custom" && endDate ? endDate : undefined,
        pdfPassword,
        includeAlerts,
        includeAttachments,
        existingTransactions,
      },
      onTransactionsFetched,
    );
  };

  return (
    <div className="mb-6 rounded-card border border-brand-primary/10 bg-linear-to-r from-brand-primary/5 via-card to-card p-5 shadow-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CloudUploadIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-brand-deep">{GMAIL_UI_TEXT.TITLE}</h3>
              {status.connected ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {GMAIL_UI_TEXT.CONNECTED}
                  </span>
                  {status.autoSyncEnabled && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {GMAIL_UI_TEXT.AUTO_SYNC_ACTIVE}
                    </span>
                  )}
                </>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {GMAIL_UI_TEXT.NOT_CONNECTED}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {status.connected && status.email
                ? GMAIL_UI_TEXT.CONNECTED_SUBTITLE.replace("{email}", status.email)
                : GMAIL_UI_TEXT.DISCONNECTED_SUBTITLE}
            </p>
            {status.connected && status.lastSyncAt && (
              <p className="mt-1 text-[11px] text-gray-400">
                {GMAIL_UI_TEXT.LAST_SYNCED.replace("{time}", new Date(status.lastSyncAt).toLocaleString())}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {checkingStatus ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Spinner className="h-4 w-4" /> {GMAIL_UI_TEXT.CHECKING}
            </div>
          ) : status.connected ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs"
              >
                {showOptions ? GMAIL_UI_TEXT.HIDE_OPTIONS : GMAIL_UI_TEXT.SHOW_OPTIONS}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={syncing}
                onClick={handleSync}
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                {syncing ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>{GMAIL_UI_TEXT.SCANNING}</span>
                  </>
                ) : (
                  <>
                    <RefreshIcon className="h-3.5 w-3.5" />
                    <span>{GMAIL_UI_TEXT.SYNC_BUTTON}</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={connectGmail}
              disabled={!isConfigured}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <span>{GMAIL_UI_TEXT.CONNECT_BUTTON}</span>
            </Button>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
          <WarningIcon className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{GMAIL_UI_TEXT.OAUTH_NOT_CONFIGURED_HINT}</span>
        </div>
      )}

      {syncProgress.visible && (
        <div className="mt-4 rounded-lg border border-brand-primary/10 bg-white/70 p-3 dark:bg-surface-low/60">
          <ProgressPercent
            value={syncProgress.percent}
            label={syncProgress.label}
            ariaLabel={GMAIL_UI_TEXT.SYNC_PROGRESS_ARIA}
          />
        </div>
      )}

      {/* Sync Options Panel */}
      {status.connected && showOptions && (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 text-xs">
          {/* Date Range Section */}
          <div className="rounded-lg bg-white/60 p-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-brand-deep">{GMAIL_UI_TEXT.DATE_RANGE_TYPE}</label>
              <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setRangeMode("preset")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    rangeMode === "preset"
                      ? "bg-white text-brand-deep shadow-xs"
                      : "text-gray-500 hover:text-brand-deep"
                  }`}
                >
                  {GMAIL_UI_TEXT.DATE_RANGE_PRESET}
                </button>
                <button
                  type="button"
                  onClick={() => setRangeMode("custom")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    rangeMode === "custom"
                      ? "bg-white text-brand-deep shadow-xs"
                      : "text-gray-500 hover:text-brand-deep"
                  }`}
                >
                  {GMAIL_UI_TEXT.DATE_RANGE_CUSTOM}
                </button>
              </div>
            </div>

            {rangeMode === "preset" ? (
              <div className="mt-2.5">
                <select
                  value={daysBack}
                  onChange={(e) => setDaysBack(Number(e.target.value))}
                  className="w-full rounded border border-gray-200 bg-white p-2 text-xs"
                >
                  {GMAIL_DATE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] text-gray-500">{GMAIL_UI_TEXT.START_DATE}</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-0.5 w-full rounded border border-gray-200 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500">{GMAIL_UI_TEXT.END_DATE}</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-0.5 w-full rounded border border-gray-200 bg-white p-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1 text-[11px]">
                  <span className="text-gray-400">{GMAIL_UI_TEXT.QUICK_SETS_LABEL}</span>
                  <button
                    type="button"
                    onClick={() => setMonthRange(0)}
                    className="text-brand-primary underline hover:opacity-80"
                  >
                    {GMAIL_UI_TEXT.QUICK_SET_THIS_MONTH}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthRange(1)}
                    className="text-brand-primary underline hover:opacity-80"
                  >
                    {GMAIL_UI_TEXT.QUICK_SET_LAST_MONTH}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Sync & Additional Options Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Auto-Sync Controls */}
            <div className="rounded-lg bg-white/60 p-3">
              <label className="block font-semibold text-brand-deep">{GMAIL_UI_TEXT.AUTO_SYNC_TITLE}</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(status.autoSyncEnabled)}
                    onChange={(e) => void updateAutoSync(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="font-medium text-brand-deep">{GMAIL_UI_TEXT.AUTO_SYNC_ENABLE}</span>
                </label>

                {status.autoSyncEnabled && (
                  <div>
                    <label className="block text-[11px] text-gray-500">{GMAIL_UI_TEXT.AUTO_SYNC_INTERVAL}</label>
                    <select
                      value={status.autoSyncIntervalHours || GMAIL_DEFAULTS.AUTO_SYNC_INTERVAL_HOURS}
                      onChange={(e) => void updateAutoSync(true, Number(e.target.value))}
                      className="mt-1 w-full rounded border border-gray-200 bg-white p-1.5 text-xs"
                    >
                      {GMAIL_AUTO_SYNC_INTERVALS.map((opt) => (
                        <option key={opt.hours} value={opt.hours}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Sources Selection */}
            <div className="rounded-lg bg-white/60 p-3">
              <label className="block font-semibold text-brand-deep">{GMAIL_UI_TEXT.SOURCES}</label>
              <div className="mt-2 space-y-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAlerts}
                    onChange={(e) => setIncludeAlerts(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <span>{GMAIL_UI_TEXT.SOURCE_ALERTS}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAttachments}
                    onChange={(e) => setIncludeAttachments(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <span>{GMAIL_UI_TEXT.SOURCE_STATEMENTS}</span>
                </label>
              </div>
            </div>

            {/* PDF Password Input */}
            <div className="rounded-lg bg-white/60 p-3">
              <label className="block font-semibold text-brand-deep">{GMAIL_UI_TEXT.PDF_PASSWORD}</label>
              <input
                type="password"
                placeholder={GMAIL_UI_TEXT.PDF_PASSWORD_PLACEHOLDER}
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                className="mt-1.5 w-full rounded border border-gray-200 bg-white p-1.5 text-xs"
              />
              <span className="mt-1 block text-[10px] text-gray-400">{GMAIL_UI_TEXT.PDF_PASSWORD_HINT}</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={disconnectGmail}
              className="text-xs text-rose-500 hover:text-rose-700 underline"
            >
              {GMAIL_UI_TEXT.DISCONNECT_BUTTON}
            </button>
          </div>
        </div>
      )}

      {/* Sync Summary Notification */}
      {syncSummary && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-white/80 p-3 text-xs shadow-xs dark:border-outline-variant dark:bg-card">
          <div className="flex items-center justify-between font-semibold text-brand-deep">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-income">
              <CheckCircleIcon className="h-4 w-4" />
              {GMAIL_UI_TEXT.SYNC_SUMMARY}
            </span>
            <button
              type="button"
              onClick={() => setSyncSummary(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-on-surface-variant"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 rounded-lg border border-primary-main/15 bg-primary-main/5 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
              {GMAIL_UI_TEXT.NEW_TRANSACTIONS}
            </p>
            <p className="mt-0.5 text-sm font-bold text-brand-deep">
              {GMAIL_UI_TEXT.NEW_TRANSACTIONS_COUNT.replace("{count}", String(syncSummary.newCount ?? 0))}
            </p>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-gray-600 dark:text-on-surface-variant sm:grid-cols-5">
            <div>
              {GMAIL_UI_TEXT.EMAILS_SCANNED}:{" "}
              <span className="font-bold text-brand-deep">{syncSummary.emailsScanned}</span>
            </div>
            <div>
              {GMAIL_UI_TEXT.ALERTS_FOUND}:{" "}
              <span className="font-bold text-brand-deep">{syncSummary.alertEmailsFound}</span>
            </div>
            <div>
              {GMAIL_UI_TEXT.STATEMENTS_FOUND}:{" "}
              <span className="font-bold text-brand-deep">{syncSummary.statementAttachmentsFound}</span>
            </div>
            <div>
              {GMAIL_UI_TEXT.CRED_BILLS_FOUND}:{" "}
              <span className="font-bold text-brand-deep">{syncSummary.credBillsFound ?? 0}</span>
            </div>
            <div>
              {GMAIL_UI_TEXT.DUPLICATES_SKIPPED}:{" "}
              <span className="font-bold text-amber-600">{syncSummary.duplicatesCount}</span>
            </div>
          </div>
          {(() => {
            const lockedCount = syncSummary.lockedAttachments?.length ?? 0;
            if (lockedCount === 0) return null;
            return (
              <div className="mt-2 text-[11px] font-medium text-amber-800">
                {GMAIL_UI_TEXT.LOCKED_FOUND}: <span className="font-bold">{lockedCount}</span>
                {" — "}
                {GMAIL_UI_TEXT.SYNC_LOCKED_NEED_PASSWORD.replace("{count}", String(lockedCount))}
              </div>
            );
          })()}
          {syncSummary.errors.length > 0 && (
            <div className="mt-2 text-[11px] text-rose-600">{syncSummary.errors[0]}</div>
          )}
        </div>
      )}
    </div>
  );
}
