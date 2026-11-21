"use client";

import { useCallback, useEffect, useState } from "react";

import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";
import { showError, showInfo, showSuccess } from "@utils/toast";

import type { DuplicateCheckable } from "@utils/duplicateDetection";

import type { ParsedStatementTransaction } from "@/lib/statement/types";
import type { GmailConnectionStatus, GmailSyncOptions, GmailSyncResponse } from "@/types/gmail";

export function useGmailIntegration(userId: string = GMAIL_DEFAULTS.DEFAULT_USER_ID) {
  const [status, setStatus] = useState<GmailConnectionStatus>({ connected: false });
  const [isConfigured, setIsConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncSummary, setSyncSummary] = useState<GmailSyncResponse["meta"] | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/gmail/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = (await res.json()) as GmailConnectionStatus & { isConfigured: boolean };
        setStatus(data);
        setIsConfigured(data.isConfigured !== false);
      }
    } catch {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth redirect notifications
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const gmailConnected = url.searchParams.get("gmail");
      const gmailError = url.searchParams.get("gmail_error");
      const email = url.searchParams.get("email");

      if (gmailConnected === "connected") {
        showSuccess(`Gmail connected successfully${email ? ` (${email})` : ""}!`);
        fetchStatus();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (gmailError) {
        showError(`Gmail connection failed: ${decodeURIComponent(gmailError)}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [fetchStatus]);

  const connectGmail = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/gmail/url?userId=${encodeURIComponent(userId)}`);
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        showError(data.error || GMAIL_ERROR_MESSAGES.OAUTH_NOT_CONFIGURED);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      showError(err instanceof Error ? err.message : GMAIL_ERROR_MESSAGES.OAUTH_NOT_CONFIGURED);
    }
  }, [userId]);

  const disconnectGmail = useCallback(async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setStatus({ connected: false });
        setSyncSummary(null);
        showInfo("Gmail account disconnected.");
      }
    } catch {
      showError(GMAIL_ERROR_MESSAGES.DISCONNECT_FAILED);
    } finally {
      setDisconnecting(false);
    }
  }, [userId]);

  const updateAutoSync = useCallback(
    async (autoSyncEnabled: boolean, autoSyncIntervalHours?: number) => {
      try {
        const res = await fetch("/api/gmail/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            autoSyncEnabled,
            autoSyncIntervalHours,
          }),
        });
        if (res.ok) {
          setStatus((prev) => ({
            ...prev,
            autoSyncEnabled,
            autoSyncIntervalHours: autoSyncIntervalHours ?? prev.autoSyncIntervalHours,
          }));
          showSuccess(autoSyncEnabled ? "Auto-sync enabled." : "Auto-sync disabled.");
        }
      } catch {
        showError("Failed to update auto-sync settings.");
      }
    },
    [userId],
  );

  const syncGmail = useCallback(
    async (
      options: GmailSyncOptions & { existingTransactions?: DuplicateCheckable[] },
      onSuccess?: (transactions: ParsedStatementTransaction[], meta: GmailSyncResponse["meta"]) => void,
      silent = false,
    ) => {
      setSyncing(true);
      setSyncSummary(null);

      try {
        const res = await fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            daysBack: options.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK,
            startDate: options.startDate?.trim() || undefined,
            endDate: options.endDate?.trim() || undefined,
            pdfPassword: options.pdfPassword?.trim() || undefined,
            includeAlerts: options.includeAlerts !== false,
            includeAttachments: options.includeAttachments !== false,
            existingTransactions: options.existingTransactions || [],
          }),
        });

        const data = (await res.json()) as GmailSyncResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error || GMAIL_ERROR_MESSAGES.SYNC_FAILED);
        }

        setSyncSummary(data.meta);
        fetchStatus();

        if (data.transactions.length > 0) {
          onSuccess?.(data.transactions, data.meta);
          if (!silent) {
            showSuccess(`Found ${data.transactions.length} new transaction(s)! Added to staging for review.`);
          }
        } else if (data.meta.duplicatesCount > 0) {
          if (!silent) {
            showInfo(
              `All ${data.meta.duplicatesCount} transactions found are already imported. No new entries to stage.`,
            );
          }
        } else if (!silent) {
          showInfo("No bank statement emails found in the selected time window.");
        }
      } catch (err) {
        if (!silent) {
          showError(err instanceof Error ? err.message : GMAIL_ERROR_MESSAGES.SYNC_FAILED);
        }
      } finally {
        setSyncing(false);
      }
    },
    [fetchStatus, userId],
  );

  return {
    status,
    isConfigured,
    loading,
    syncing,
    disconnecting,
    syncSummary,
    setSyncSummary,
    connectGmail,
    disconnectGmail,
    updateAutoSync,
    syncGmail,
    fetchStatus,
  };
}
