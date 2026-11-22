"use client";

import { useCallback, useEffect, useState } from "react";

import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES, GMAIL_UI_TEXT } from "@constants";

import type { GmailConnectionStatus, GmailSyncOptions, GmailSyncResponse } from "@/types/gmail";

import { useAppSelector } from "@store/hooks";
import { applyCredBills, credBillsToastMessage } from "@utils/applyCredBills";
import type { DuplicateCheckable } from "@utils/duplicateDetection";
import { toDuplicateCheckPayload } from "@utils/duplicatePayload";
import { mergeLockedQueue } from "@utils/gmailLockedQueue";
import { showError, showInfo, showSuccess, showWarning } from "@utils/toast";

import { authedFetch } from "@/lib/authedApiClient";
import type { ParsedStatementTransaction } from "@/lib/statement/types";



export function useGmailIntegration(userId: string = GMAIL_DEFAULTS.DEFAULT_USER_ID) {
  const existingBills = useAppSelector((s) => s.bills.items);
  const [status, setStatus] = useState<GmailConnectionStatus>({ connected: false });
  const [isConfigured, setIsConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncSummary, setSyncSummary] = useState<GmailSyncResponse["meta"] | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!userId || userId === GMAIL_DEFAULTS.DEFAULT_USER_ID) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await authedFetch(`/api/gmail/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = (await res.json()) as GmailConnectionStatus & { isConfigured: boolean };
        setStatus(data);
        setIsConfigured(data.isConfigured !== false);
      }
    } catch {
      // Status check is best-effort; UI stays on last known connection state.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const gmailConnected = url.searchParams.get("gmail");
      const gmailError = url.searchParams.get("gmail_error");
      const email = url.searchParams.get("email");

      if (gmailConnected === "connected") {
        showSuccess(
          GMAIL_UI_TEXT.CONNECTED_TOAST.replace("{email}", email ? ` (${email})` : ""),
        );
        fetchStatus();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (gmailError) {
        showError(
          GMAIL_UI_TEXT.CONNECTION_FAILED_TOAST.replace("{error}", decodeURIComponent(gmailError)),
        );
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [fetchStatus]);

  const connectGmail = useCallback(async () => {
    try {
      const res = await authedFetch(`/api/auth/gmail/url?userId=${encodeURIComponent(userId)}`);
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
      const res = await authedFetch("/api/gmail/disconnect", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setStatus({ connected: false });
        setSyncSummary(null);
        showInfo(GMAIL_UI_TEXT.DISCONNECTED_TOAST);
      } else {
        showError(GMAIL_ERROR_MESSAGES.DISCONNECT_FAILED);
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
        const res = await authedFetch("/api/gmail/settings", {
          method: "POST",
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
          showSuccess(
            autoSyncEnabled ? GMAIL_UI_TEXT.AUTO_SYNC_ENABLED_TOAST : GMAIL_UI_TEXT.AUTO_SYNC_DISABLED_TOAST,
          );
        } else {
          showError(GMAIL_ERROR_MESSAGES.SETTINGS_UPDATE_FAILED);
        }
      } catch {
        showError(GMAIL_ERROR_MESSAGES.SETTINGS_UPDATE_FAILED);
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
        const existing = options.existingTransactions
          ? toDuplicateCheckPayload(options.existingTransactions)
          : [];

        const res = await authedFetch("/api/gmail/sync", {
          method: "POST",
          body: JSON.stringify({
            userId,
            daysBack: options.daysBack ?? GMAIL_DEFAULTS.DAYS_BACK,
            startDate: options.startDate?.trim() || undefined,
            endDate: options.endDate?.trim() || undefined,
            pdfPassword: options.pdfPassword?.trim() || undefined,
            includeAlerts: options.includeAlerts !== false,
            includeAttachments: options.includeAttachments !== false,
            existingTransactions: existing,
          }),
        });

        const data = (await res.json()) as GmailSyncResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error || GMAIL_ERROR_MESSAGES.SYNC_FAILED);
        }

        const locked = data.meta.lockedAttachments ?? [];
        if (locked.length > 0) {
          mergeLockedQueue(userId, locked);
        }

        const credBills = data.credBills ?? [];
        let credUpserted = 0;
        if (credBills.length > 0) {
          const applied = await applyCredBills(userId, credBills, existingBills);
          credUpserted = applied.upserted;
        }

        setSyncSummary({
          ...data.meta,
          lockedAttachments: locked,
          credBillsFound: credUpserted || data.meta.credBillsFound,
        });
        fetchStatus();

        if (data.transactions.length > 0) {
          onSuccess?.(data.transactions, { ...data.meta, lockedAttachments: locked });
          if (!silent) {
            showSuccess(GMAIL_UI_TEXT.SYNC_FOUND_STAGED.replace("{count}", String(data.transactions.length)));
          }
        } else if (data.meta.duplicatesCount > 0) {
          if (!silent) {
            showInfo(GMAIL_UI_TEXT.SYNC_ALL_DUPLICATES.replace("{count}", String(data.meta.duplicatesCount)));
          }
        } else if (!silent && locked.length === 0 && credUpserted === 0) {
          showInfo(GMAIL_UI_TEXT.SYNC_NONE_FOUND);
        }

        if (!silent && credUpserted > 0) {
          showSuccess(credBillsToastMessage(credUpserted));
        }

        if (!silent && locked.length > 0) {
          showWarning(GMAIL_UI_TEXT.SYNC_LOCKED_NEED_PASSWORD.replace("{count}", String(locked.length)));
          if (data.transactions.length === 0) {
            onSuccess?.([], { ...data.meta, lockedAttachments: locked });
          }
        }
      } catch (err) {
        if (!silent) {
          showError(err instanceof Error ? err.message : GMAIL_ERROR_MESSAGES.SYNC_FAILED);
        }
      } finally {
        setSyncing(false);
      }
    },
    [existingBills, fetchStatus, userId],
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
