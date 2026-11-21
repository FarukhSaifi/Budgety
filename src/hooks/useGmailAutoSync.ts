"use client";

import { useEffect, useRef } from "react";

import { GMAIL_DEFAULTS } from "@constants";

import type { GmailConnectionStatus, GmailSyncResponse } from "@/types/gmail";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { addCategoriesBulk } from "@store/slices/categoriesSlice";
import { addTransactionsBulk } from "@store/slices/transactionsSlice";
import { applySmartRulesToStaging } from "@utils/enrichStagingCategories";
import { stagingToTransactions, type StagingRow } from "@utils/importHelpers";
import { showSuccess } from "@utils/toast";

import type { ParsedStatementTransaction } from "@/lib/statement/types";

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

/**
 * Automatically syncs bank statement and alert transactions from Gmail
 * on app open when the last sync is older than the configured threshold (default: 12h).
 */
export function useGmailAutoSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const existingTransactions = useAppSelector((s) => s.transactions.items);
  const rules = useAppSelector((s) => s.rules.items);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!userId || hasTriggeredRef.current) return;

    // Check session storage to avoid multiple auto-syncs on fast route transitions
    const sessionKey = `gmail_auto_synced_${userId}`;
    const lastSessionSync = sessionStorage.getItem(sessionKey);
    const now = Date.now();
    const intervalMs = GMAIL_DEFAULTS.AUTO_SYNC_INTERVAL_HOURS * 60 * 60 * 1000;

    if (lastSessionSync && now - Number(lastSessionSync) < intervalMs) {
      return;
    }

    hasTriggeredRef.current = true;

    async function runAutoSync() {
      try {
        // 1. Check if Gmail is connected and when it was last synced
        const statusRes = await fetch(`/api/gmail/status?userId=${encodeURIComponent(userId!)}`);
        if (!statusRes.ok) return;

        const status = (await statusRes.json()) as GmailConnectionStatus;
        if (!status.connected) return;

        if (status.lastSyncAt) {
          const lastSyncTime = new Date(status.lastSyncAt).getTime();
          if (now - lastSyncTime < intervalMs) {
            sessionStorage.setItem(sessionKey, String(now));
            return;
          }
        }

        // 2. Trigger background sync for the past 7 days
        const syncRes = await fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            daysBack: GMAIL_DEFAULTS.AUTO_SYNC_DAYS_BACK,
            includeAlerts: true,
            includeAttachments: true,
            existingTransactions,
          }),
        });

        if (!syncRes.ok) return;

        const data = (await syncRes.json()) as GmailSyncResponse;
        sessionStorage.setItem(sessionKey, String(now));

        // 3. If new transactions were discovered, save them automatically to Firestore
        if (data.transactions && data.transactions.length > 0) {
          const staging = applySmartRulesToStaging(parsedToStaging(data.transactions), rules);
          const toSave = stagingToTransactions(staging, userId!);

          await dispatch(addTransactionsBulk(toSave)).unwrap();

          // Auto-seed novel categories if any were discovered
          if (data.meta?.discoveredCategories) {
            const { income = [], expense = [] } = data.meta.discoveredCategories;
            const novel = [
              ...income.map((name) => ({ name, type: "income" as const, color: "#f2f2f2", userId: userId! })),
              ...expense.map((name) => ({ name, type: "expense" as const, color: "#f2f2f2", userId: userId! })),
            ];
            if (novel.length > 0) {
              void dispatch(addCategoriesBulk(novel));
            }
          }

          showSuccess(`Auto-synced ${data.transactions.length} new transaction(s) from Gmail!`);
        }
      } catch {
        // Silent failure on auto-sync: manual sync button remains available
      }
    }

    void runAutoSync();
  }, [dispatch, existingTransactions, rules, userId]);
}
