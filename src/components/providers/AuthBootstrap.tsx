"use client";

import { useEffect } from "react";

import { ERROR_MESSAGES } from "@constants";

import { useUiPeriodSync } from "@hooks/useUiPeriodSync";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { listenToAuthChanges } from "@store/slices/authSlice";
import { clearBills, markBillsLoadFailed, setBills } from "@store/slices/billsSlice";
import { clearBudgets, markBudgetsLoadFailed, setBudgets } from "@store/slices/budgetsSlice";
import {
  clearCategories,
  ensureDefaultCategories,
  markCategoriesLoadFailed,
  setCategories,
} from "@store/slices/categoriesSlice";
import { clearChat } from "@store/slices/chatSlice";
import { clearDebts, markDebtsLoadFailed, setDebts } from "@store/slices/debtSlice";
import { clearGoals, markGoalsLoadFailed, setGoals } from "@store/slices/goalsSlice";
import { clearNetWorth, markNetWorthLoadFailed, setNetWorthItems } from "@store/slices/netWorthSlice";
import { clearRecurring, markRecurringLoadFailed, setRecurring } from "@store/slices/recurringSlice";
import { clearRules, markRulesLoadFailed, setRules } from "@store/slices/rulesSlice";
import { clearSplit, markSplitLoadFailed, setSplitExpenses, setSplitParticipants } from "@store/slices/splitSlice";
import { clearTransactions, markTransactionsLoadFailed, setTransactions } from "@store/slices/transactionsSlice";
import { fetchUserData } from "@store/thunks/fetchUserData";
import { migrateLocalCategoriesToFirestore } from "@utils/categoryStorage";
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
      dispatch(clearCategories());
      dispatch(clearRules());
      dispatch(clearDebts());
      dispatch(clearNetWorth());
      dispatch(clearSplit());
      dispatch(clearChat());
      return undefined;
    }

    const uid = user.uid;
    let didToast = false;

    const makeOnError = (markFailed: (message: string) => void) => (error: Error) => {
      if (!didToast) {
        didToast = true;
        showError(ERROR_MESSAGES.LOAD_DATA_FAILED);
      }
      markFailed(error.message || ERROR_MESSAGES.LOAD_DATA_FAILED);
    };

    void (async () => {
      try {
        await migrateLocalCategoriesToFirestore(uid);
        await dispatch(ensureDefaultCategories(uid)).unwrap();
      } catch {
        // Listener still hydrates; seed failure is non-fatal.
      }
    })();

    // Priority bootstrap (recent txs + budgets first), then secondary collections.
    void dispatch(fetchUserData(uid));

    const unsubs = [
      firestoreListeners.transactions(
        uid,
        (items) => dispatch(setTransactions(items)),
        makeOnError((message) => dispatch(markTransactionsLoadFailed(message))),
      ),
      firestoreListeners.budgets(
        uid,
        (items) => dispatch(setBudgets(items)),
        makeOnError((message) => dispatch(markBudgetsLoadFailed(message))),
      ),
      firestoreListeners.bills(
        uid,
        (items) => dispatch(setBills(items)),
        makeOnError((message) => dispatch(markBillsLoadFailed(message))),
      ),
      firestoreListeners.goals(
        uid,
        (items) => dispatch(setGoals(items)),
        makeOnError((message) => dispatch(markGoalsLoadFailed(message))),
      ),
      firestoreListeners.recurring(
        uid,
        (items) => dispatch(setRecurring(items)),
        makeOnError((message) => dispatch(markRecurringLoadFailed(message))),
      ),
      firestoreListeners.categories(
        uid,
        (items) => dispatch(setCategories(items)),
        makeOnError((message) => dispatch(markCategoriesLoadFailed(message))),
      ),
      firestoreListeners.rules(
        uid,
        (items) => dispatch(setRules(items)),
        makeOnError((message) => dispatch(markRulesLoadFailed(message))),
      ),
      firestoreListeners.debts(
        uid,
        (items) => dispatch(setDebts(items)),
        makeOnError((message) => dispatch(markDebtsLoadFailed(message))),
      ),
      firestoreListeners.netWorthItems(
        uid,
        (items) => dispatch(setNetWorthItems(items)),
        makeOnError((message) => dispatch(markNetWorthLoadFailed(message))),
      ),
      firestoreListeners.splitParticipants(
        uid,
        (items) => dispatch(setSplitParticipants(items)),
        makeOnError((message) => dispatch(markSplitLoadFailed(message))),
      ),
      firestoreListeners.splitExpenses(
        uid,
        (items) => dispatch(setSplitExpenses(items)),
        makeOnError((message) => dispatch(markSplitLoadFailed(message))),
      ),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [dispatch, user?.uid, initialized]);

  return <>{children}</>;
}
