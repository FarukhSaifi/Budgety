import { createAsyncThunk } from "@reduxjs/toolkit";

import { fetchBills } from "../slices/billsSlice";
import { fetchBudgets } from "../slices/budgetsSlice";
import { fetchDebts } from "../slices/debtSlice";
import { fetchGoals } from "../slices/goalsSlice";
import { fetchNetWorthItems } from "../slices/netWorthSlice";
import { fetchRecurring } from "../slices/recurringSlice";
import { fetchRules } from "../slices/rulesSlice";
import { fetchTransactions } from "../slices/transactionsSlice";

/**
 * Two-tier load:
 * 1) Priority — transactions + budgets (dashboard-critical)
 * 2) Secondary — bills, goals, recurring, rules, debts, net worth
 * Categories hydrate via AuthBootstrap listeners + ensureDefaultCategories.
 */
export const fetchUserData = createAsyncThunk("app/fetchUserData", async (userId: string, { dispatch }) => {
  await Promise.all([dispatch(fetchTransactions(userId)).unwrap(), dispatch(fetchBudgets(userId)).unwrap()]);

  await Promise.allSettled([
    dispatch(fetchBills(userId)).unwrap(),
    dispatch(fetchGoals(userId)).unwrap(),
    dispatch(fetchRecurring(userId)).unwrap(),
    dispatch(fetchRules(userId)).unwrap(),
    dispatch(fetchDebts(userId)).unwrap(),
    dispatch(fetchNetWorthItems(userId)).unwrap(),
  ]);

  return userId;
});
