"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { GMAIL_DEFAULTS, GMAIL_UI_TEXT } from "@constants";

import { APP_ROUTES } from "@constants/routes";

import type { GmailConnectionStatus, GmailSyncResponse } from "@/types/gmail";

import { useAppSelector } from "@store/hooks";
import { applyCredBills, credBillsToastMessage } from "@utils/applyCredBills";
import { toDuplicateCheckPayload } from "@utils/duplicatePayload";
import { mergeLockedQueue } from "@utils/gmailLockedQueue";
import { mergeReviewStaging } from "@utils/gmailReviewQueue";
import { showSuccess, showWarning } from "@utils/toast";

import { authedFetch } from "@/lib/authedApiClient";

/**
 * Background Gmail auto-sync on app open when:
 * - user is signed in
 * - transactions have loaded (dedupe-ready)
 * - Gmail is connected
 * - auto-sync is enabled in settings
 * - last sync is older than the configured interval
 *
 * Unlocked transactions are staged into Import Review (never persisted directly).
 * Password-locked PDFs are queued for Import Review unlock.
 */
export function useGmailAutoSync() {
  const router = useRouter();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const existingTransactions = useAppSelector((s) => s.transactions.items);
  const existingBills = useAppSelector((s) => s.bills.items);
  const txStatus = useAppSelector((s) => s.transactions.status);
  const hasTriggeredRef = useRef(false);
  const retryCountRef = useRef(0);
  const transactionsRef = useRef(existingTransactions);
  const billsRef = useRef(existingBills);
  const [autoSyncing, setAutoSyncing] = useState(false);

  useEffect(() => {
    transactionsRef.current = existingTransactions;
  }, [existingTransactions]);

  useEffect(() => {
    billsRef.current = existingBills;
  }, [existingBills]);

  useEffect(() => {
    if (!userId || hasTriggeredRef.current) return;
    if (txStatus !== "succeeded") return;

    const sessionKey = `${GMAIL_DEFAULTS.SESSION_SYNC_KEY_PREFIX}${userId}`;
    hasTriggeredRef.current = true;

    let cancelled = false;
    let retryTimeoutId: number | undefined;

    async function runAutoSync() {
      try {
        const statusRes = await authedFetch(`/api/gmail/status?userId=${encodeURIComponent(userId!)}`);
        if (!statusRes.ok) {
          throw new Error(GMAIL_UI_TEXT.AUTO_SYNC_FAILED);
        }

        const status = (await statusRes.json()) as GmailConnectionStatus;
        if (!status.connected || status.autoSyncEnabled === false) {
          sessionStorage.setItem(sessionKey, String(Date.now()));
          return;
        }

        const intervalHours = status.autoSyncIntervalHours ?? GMAIL_DEFAULTS.AUTO_SYNC_INTERVAL_HOURS;
        const intervalMs = intervalHours * 60 * 60 * 1000;
        const now = Date.now();

        const lastSessionSync = sessionStorage.getItem(sessionKey);
        if (lastSessionSync && now - Number(lastSessionSync) < intervalMs) {
          return;
        }

        if (status.lastSyncAt) {
          const lastSyncTime = new Date(status.lastSyncAt).getTime();
          if (now - lastSyncTime < intervalMs) {
            sessionStorage.setItem(sessionKey, String(now));
            return;
          }
        }

        if (!cancelled) setAutoSyncing(true);

        const syncRes = await authedFetch("/api/gmail/sync", {
          method: "POST",
          body: JSON.stringify({
            userId,
            daysBack: GMAIL_DEFAULTS.AUTO_SYNC_DAYS_BACK,
            includeAlerts: true,
            includeAttachments: true,
            existingTransactions: toDuplicateCheckPayload(transactionsRef.current),
          }),
        });

        if (!syncRes.ok) {
          throw new Error(GMAIL_UI_TEXT.AUTO_SYNC_FAILED);
        }

        if (cancelled) return;

        const data = (await syncRes.json()) as GmailSyncResponse;
        sessionStorage.setItem(sessionKey, String(now));

        const locked = data.meta?.lockedAttachments ?? [];
        if (locked.length > 0) {
          mergeLockedQueue(userId!, locked);
        }

        const syncedCount = data.transactions?.length ?? 0;
        if (syncedCount > 0) {
          mergeReviewStaging(userId!, data.transactions);
        }

        const credBills = data.credBills ?? [];
        let credUpserted = 0;
        if (credBills.length > 0) {
          const applied = await applyCredBills(userId!, credBills, billsRef.current);
          credUpserted = applied.upserted;
        }

        if (cancelled) return;

        if (syncedCount > 0 && locked.length > 0) {
          showWarning(
            GMAIL_UI_TEXT.AUTO_SYNC_PARTIAL.replace("{count}", String(syncedCount)).replace(
              "{locked}",
              String(locked.length),
            ),
          );
          router.push(APP_ROUTES.transactionsImport);
        } else if (syncedCount > 0) {
          showSuccess(GMAIL_UI_TEXT.AUTO_SYNC_SUCCESS.replace("{count}", String(syncedCount)));
          router.push(APP_ROUTES.transactionsImport);
        } else if (locked.length > 0) {
          showWarning(GMAIL_UI_TEXT.AUTO_SYNC_LOCKED_ONLY.replace("{locked}", String(locked.length)));
          router.push(APP_ROUTES.transactionsImport);
        } else if (credUpserted > 0) {
          showSuccess(credBillsToastMessage(credUpserted));
        }
      } catch {
        if (cancelled) return;

        if (retryCountRef.current < GMAIL_DEFAULTS.AUTO_SYNC_MAX_RETRIES) {
          retryCountRef.current += 1;
          await new Promise<void>((resolve) => {
            retryTimeoutId = window.setTimeout(resolve, GMAIL_DEFAULTS.AUTO_SYNC_RETRY_DELAY_MS);
          });
          if (cancelled) return;
          await runAutoSync();
          return;
        }
        // Allow a later session/navigation to retry after terminal failure.
        hasTriggeredRef.current = false;
        showWarning(GMAIL_UI_TEXT.AUTO_SYNC_FAILED);
      } finally {
        if (!cancelled) setAutoSyncing(false);
      }
    }

    void runAutoSync();

    return () => {
      cancelled = true;
      if (retryTimeoutId !== undefined) {
        window.clearTimeout(retryTimeoutId);
      }
      // If cleanup aborted an in-flight attempt, allow a fresh trigger on remount.
      if (hasTriggeredRef.current && !sessionStorage.getItem(sessionKey)) {
        hasTriggeredRef.current = false;
      }
    };
  }, [router, txStatus, userId]);

  return { autoSyncing };
}
