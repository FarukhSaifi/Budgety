import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Budget } from "@/types";

interface BudgetsState {
  items: Budget[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BudgetsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchBudgets = createAsyncThunk(
  "budgets/fetch",
  async (userId: string) => firestoreApi.fetchBudgets(userId),
);

export const addBudget = createAsyncThunk(
  "budgets/add",
  async (budget: Budget) => firestoreApi.addBudget(budget),
);

export const updateBudget = createAsyncThunk(
  "budgets/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Budget>;
  }) => firestoreApi.updateBudget(id, userId, patch),
);

export const deleteBudget = createAsyncThunk(
  "budgets/delete",
  async (id: string) => {
    await firestoreApi.deleteBudget(id);
    return id;
  },
);

const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    setBudgets(state, action: PayloadAction<Budget[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearBudgets(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markBudgetsLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load budgets";
      })
      .addCase(addBudget.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.items = state.items.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        );
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export const { setBudgets, clearBudgets, markBudgetsLoadFailed } = budgetsSlice.actions;
export default budgetsSlice.reducer;
