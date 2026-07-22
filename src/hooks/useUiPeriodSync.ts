"use client";

import { VIEW_PERIODS } from "@constants";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setViewPeriod } from "@store/slices/uiSlice";
import type { Transaction, ViewPeriod } from "@/types";
import { getMonthYear } from "@utils/dateUtils";
import { loadPersistedUiPeriod, savePersistedUiPeriod } from "@utils/uiPeriodStorage";
import { useEffect, useRef, useSyncExternalStore } from "react";

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

function filterByPeriod(
  transactions: Transaction[],
  viewPeriod: ViewPeriod,
  selectedMonth: number,
  selectedYear: number,
): Transaction[] {
  if (viewPeriod === VIEW_PERIODS.ALL) return transactions;
  return transactions.filter((tx) => {
    const monthYear = getMonthYear(tx.date);
    if (!monthYear) return false;
    if (viewPeriod === VIEW_PERIODS.MONTHLY) {
      return monthYear.month === selectedMonth && monthYear.year === selectedYear;
    }
    if (viewPeriod === VIEW_PERIODS.YEARLY) {
      return monthYear.year === selectedYear;
    }
    return true;
  });
}

/** Most recent calendar month that has at least one transaction. */
function mostRecentTransactionMonth(
  transactions: Transaction[],
): { month: number; year: number } | null {
  let best: { month: number; year: number; key: string } | null = null;
  for (const tx of transactions) {
    const my = getMonthYear(tx.date);
    if (!my) continue;
    const key = `${my.year}-${String(my.month).padStart(2, "0")}`;
    if (!best || key > best.key) {
      best = { month: my.month, year: my.year, key };
    }
  }
  return best ? { month: best.month, year: best.year } : null;
}

/**
 * Hydrates viewPeriod/month/year from localStorage, persists changes, and
 * one-shot auto-adjusts when the active filter hides all loaded transactions
 * (typical after import into a non-current statement month + refresh).
 */
export function useUiPeriodSync(): void {
  const dispatch = useAppDispatch();
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const transactions = useAppSelector((s) => s.transactions.items);
  const txStatus = useAppSelector((s) => s.transactions.status);

  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
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
        }),
      );
    }
    markHydrated();
  }, [dispatch]);

  // Persist after hydration so SSR defaults cannot overwrite a stored import month.
  useEffect(() => {
    if (!hydrated) return;
    savePersistedUiPeriod({ viewPeriod, selectedMonth, selectedYear });
  }, [hydrated, viewPeriod, selectedMonth, selectedYear]);

  // After Firestore data arrives: if filter shows nothing but data exists,
  // jump to the most recent transaction month (once per mount).
  useEffect(() => {
    if (!hydrated || didAutoAdjustRef.current) return;
    if (txStatus !== "succeeded") return;

    if (transactions.length === 0) {
      didAutoAdjustRef.current = true;
      return;
    }

    const filtered = filterByPeriod(
      transactions,
      viewPeriod,
      selectedMonth,
      selectedYear,
    );
    if (filtered.length > 0) {
      didAutoAdjustRef.current = true;
      return;
    }

    // Prefer restored period; re-apply if hydrate raced ahead of Redux.
    if (hadPersistedRef.current) {
      const persisted = loadPersistedUiPeriod();
      if (persisted) {
        const persistedFiltered = filterByPeriod(
          transactions,
          persisted.viewPeriod,
          persisted.selectedMonth,
          persisted.selectedYear,
        );
        if (persistedFiltered.length > 0) {
          didAutoAdjustRef.current = true;
          dispatch(
            setViewPeriod({
              viewPeriod: persisted.viewPeriod,
              selectedMonth: persisted.selectedMonth,
              selectedYear: persisted.selectedYear,
            }),
          );
          return;
        }
      }
    }

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
  }, [hydrated, dispatch, transactions, txStatus, viewPeriod, selectedMonth, selectedYear]);
}
