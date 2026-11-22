"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { VIEW_PERIODS } from "@constants";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { loadOlderTransactions } from "@store/slices/transactionsSlice";
import { setViewPeriod } from "@store/slices/uiSlice";
import { filterTransactionsByPeriod, mostRecentTransactionMonth } from "@utils/periodFilter";
import { loadPersistedUiPeriod, savePersistedUiPeriod } from "@utils/uiPeriodStorage";

import type { ViewPeriod } from "@/types";

const hydrationStore = {
  hydrated: false,
  listeners: new Set<() => void>(),
};

function subscribeHydration(onStoreChange: () => void) {
  hydrationStore.listeners.add(onStoreChange);
  return () => {
    hydrationStore.listeners.delete(onStoreChange);
  };
}

function getHydrationSnapshot() {
  return hydrationStore.hydrated;
}

function getHydrationServerSnapshot() {
  return false;
}

function markHydrated() {
  if (hydrationStore.hydrated) return;
  hydrationStore.hydrated = true;
  hydrationStore.listeners.forEach((listener) => listener());
}

/**
 * Hydrates viewPeriod/month/year/range from localStorage, persists changes, and
 * one-shot auto-adjusts when the active filter hides all loaded transactions
 * (typical after import into a non-current statement month + refresh).
 *
 * Also pages older transactions when the selected month is empty but more
 * history may exist on the server (Oct/Nov outside the first 250-row window).
 */
export function useUiPeriodSync(): void {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const { viewPeriod, selectedMonth, selectedYear, rangeStart, rangeEnd } = useAppSelector((s) => s.ui);
  const transactions = useAppSelector((s) => s.transactions.items);
  const txStatus = useAppSelector((s) => s.transactions.status);
  const hasMore = useAppSelector((s) => s.transactions.hasMore);
  const loadingOlder = useAppSelector((s) => s.transactions.loadingOlder);

  const hydrated = useSyncExternalStore(subscribeHydration, getHydrationSnapshot, getHydrationServerSnapshot);
  const hadPersistedRef = useRef(false);
  const didAutoAdjustRef = useRef(false);

  // Restore period on the client before we start writing back to localStorage.
  useEffect(() => {
    const persisted = loadPersistedUiPeriod();
    hadPersistedRef.current = Boolean(persisted);
    if (persisted) {
      dispatch(
        setViewPeriod({
          viewPeriod: persisted.viewPeriod,
          selectedMonth: persisted.selectedMonth,
          selectedYear: persisted.selectedYear,
          rangeStart: persisted.rangeStart,
          rangeEnd: persisted.rangeEnd,
        }),
      );
    }
    markHydrated();
  }, [dispatch]);

  // Persist after hydration so SSR defaults cannot overwrite a stored import month.
  useEffect(() => {
    if (!hydrated) return;
    savePersistedUiPeriod({
      viewPeriod,
      selectedMonth,
      selectedYear,
      rangeStart,
      rangeEnd,
    });
  }, [hydrated, viewPeriod, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  // After Firestore data arrives: if filter shows nothing but data exists,
  // jump to the most recent transaction month (once per mount).
  useEffect(() => {
    if (!hydrated || didAutoAdjustRef.current) return;
    if (txStatus !== "succeeded") return;

    if (transactions.length === 0) {
      didAutoAdjustRef.current = true;
      return;
    }

    const periodOptions = { rangeStart, rangeEnd };
    const filtered = filterTransactionsByPeriod(transactions, viewPeriod, selectedMonth, selectedYear, periodOptions);
    if (filtered.length > 0) {
      didAutoAdjustRef.current = true;
      return;
    }

    // Prefer restored period; re-apply if hydrate raced ahead of Redux.
    if (hadPersistedRef.current) {
      const persisted = loadPersistedUiPeriod();
      if (persisted) {
        const persistedFiltered = filterTransactionsByPeriod(
          transactions,
          persisted.viewPeriod,
          persisted.selectedMonth,
          persisted.selectedYear,
          { rangeStart: persisted.rangeStart, rangeEnd: persisted.rangeEnd },
        );
        if (persistedFiltered.length > 0) {
          didAutoAdjustRef.current = true;
          dispatch(
            setViewPeriod({
              viewPeriod: persisted.viewPeriod,
              selectedMonth: persisted.selectedMonth,
              selectedYear: persisted.selectedYear,
              rangeStart: persisted.rangeStart,
              rangeEnd: persisted.rangeEnd,
            }),
          );
          return;
        }
      }
    }

    // Keep waiting while older pages may still fill the selected month.
    if (hasMore || loadingOlder) return;

    didAutoAdjustRef.current = true;

    const recent = mostRecentTransactionMonth(transactions);
    if (!recent) {
      dispatch(setViewPeriod({ viewPeriod: VIEW_PERIODS.ALL as ViewPeriod }));
      return;
    }

    dispatch(
      setViewPeriod({
        viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
        selectedMonth: recent.month,
        selectedYear: recent.year,
      }),
    );
  }, [
    hydrated,
    dispatch,
    transactions,
    txStatus,
    viewPeriod,
    selectedMonth,
    selectedYear,
    rangeStart,
    rangeEnd,
    hasMore,
    loadingOlder,
  ]);

  // When the selected month is empty but more history exists, page older txs
  // until the month has rows or the server is exhausted.
  useEffect(() => {
    if (!hydrated || !userId) return;
    if (txStatus !== "succeeded") return;
    if (viewPeriod !== VIEW_PERIODS.MONTHLY) return;
    if (!hasMore || loadingOlder) return;

    const filtered = filterTransactionsByPeriod(transactions, viewPeriod, selectedMonth, selectedYear, {
      rangeStart,
      rangeEnd,
    });
    if (filtered.length > 0) return;

    void dispatch(loadOlderTransactions(userId));
  }, [
    hydrated,
    userId,
    txStatus,
    viewPeriod,
    selectedMonth,
    selectedYear,
    rangeStart,
    rangeEnd,
    transactions,
    hasMore,
    loadingOlder,
    dispatch,
  ]);
}
