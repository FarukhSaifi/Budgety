"use client";

import { useEffect } from "react";

import { ERROR_MESSAGES } from "@constants";

import { useCategoryPersistence } from "@hooks/useCategoryPersistence";
import { useUiPeriodSync } from "@hooks/useUiPeriodSync";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { listenToAuthChanges } from "@store/slices/authSlice";
import { clearBills, markBillsLoadFailed, setBills } from "@store/slices/billsSlice";
import { clearBudgets, markBudgetsLoadFailed, setBudgets } from "@store/slices/budgetsSlice";
import { clearGoals, markGoalsLoadFailed, setGoals } from "@store/slices/goalsSlice";
import { clearRecurring, markRecurringLoadFailed, setRecurring } from "@store/slices/recurringSlice";
import { clearTransactions, markTransactionsLoadFailed, setTransactions } from "@store/slices/transactionsSlice";
import { showError } from "@utils/toast";

import { firestoreListeners } from "@/lib/firestore";

/**
 * Keeps Firebase Auth ↔ Redux in sync and attaches Firestore listeners
 * (userId-scoped) after login for real-time dashboard data.
 */
export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const initialized = useAppSelector((s) => s.auth.initialized);

  useUiPeriodSync();
  useCategoryPersistence();

  useEffect(() => {
    return listenToAuthChanges(dispatch, {
      onRedirectError: (message) => showError(message),
    });
  }, [dispatch]);

  useEffect(() => {
    if (!initialized) return undefined;

    if (!user?.uid) {
      dispatch(clearTransactions());
      dispatch(clearBudgets());
      dispatch(clearBills());
      dispatch(clearGoals());
      dispatch(clearRecurring());
      return undefined;
    }

    const uid = user.uid;
    let didToast = false;

    const makeOnError = (collection: string, markFailed: (message: string) => void) => (error: Error) => {
      // Do NOT wipe collections on error — that made refresh look like a
      // successful empty load when the real issue was permission/index.
      if (!didToast) {
        didToast = true;
        showError(ERROR_MESSAGES.LOAD_DATA_FAILED);
      }
      markFailed(error.message || ERROR_MESSAGES.LOAD_DATA_FAILED);
    };

    const unsubs = [
      firestoreListeners.transactions(
        uid,
        (items) => dispatch(setTransactions(items)),
        makeOnError("transactions", (message) => dispatch(markTransactionsLoadFailed(message))),
      ),
      firestoreListeners.budgets(
        uid,
        (items) => dispatch(setBudgets(items)),
        makeOnError("budgets", (message) => dispatch(markBudgetsLoadFailed(message))),
      ),
      firestoreListeners.bills(
        uid,
        (items) => dispatch(setBills(items)),
        makeOnError("bills", (message) => dispatch(markBillsLoadFailed(message))),
      ),
      firestoreListeners.goals(
        uid,
        (items) => dispatch(setGoals(items)),
        makeOnError("goals", (message) => dispatch(markGoalsLoadFailed(message))),
      ),
      firestoreListeners.recurring(
        uid,
        (items) => dispatch(setRecurring(items)),
        makeOnError("recurring", (message) => dispatch(markRecurringLoadFailed(message))),
      ),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [dispatch, user?.uid, initialized]);

  return <>{children}</>;
}
