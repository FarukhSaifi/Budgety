import { createAsyncThunk } from "@reduxjs/toolkit";

import { fetchBills } from "../slices/billsSlice";
import { fetchBudgets } from "../slices/budgetsSlice";
import { fetchGoals } from "../slices/goalsSlice";
import { fetchRecurring } from "../slices/recurringSlice";
import { fetchTransactions } from "../slices/transactionsSlice";

/** Load all Firestore collections scoped to the signed-in user. */
export const fetchUserData = createAsyncThunk(
  "app/fetchUserData",
  async (userId: string, { dispatch }) => {
    await Promise.all([
      dispatch(fetchTransactions(userId)).unwrap(),
      dispatch(fetchBudgets(userId)).unwrap(),
      dispatch(fetchBills(userId)).unwrap(),
      dispatch(fetchGoals(userId)).unwrap(),
      dispatch(fetchRecurring(userId)).unwrap(),
    ]);
    return userId;
  },
);
