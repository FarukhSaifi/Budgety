import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { SplitExpense, SplitParticipant } from "@/types";

interface SplitState {
  participants: SplitParticipant[];
  expenses: SplitExpense[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SplitState = {
  participants: [],
  expenses: [],
  status: "idle",
  error: null,
};

export const addSplitParticipant = createAsyncThunk(
  "split/addParticipant",
  async (participant: SplitParticipant) => firestoreApi.addSplitParticipant(participant),
);

export const deleteSplitParticipant = createAsyncThunk(
  "split/deleteParticipant",
  async (id: string) => {
    await firestoreApi.deleteSplitParticipant(id);
    return id;
  },
);

export const addSplitExpense = createAsyncThunk(
  "split/addExpense",
  async (expense: SplitExpense) => firestoreApi.addSplitExpense(expense),
);

export const updateSplitExpense = createAsyncThunk(
  "split/updateExpense",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<SplitExpense>;
  }) => firestoreApi.updateSplitExpense(id, userId, patch),
);

export const deleteSplitExpense = createAsyncThunk(
  "split/deleteExpense",
  async (id: string) => {
    await firestoreApi.deleteSplitExpense(id);
    return id;
  },
);

const splitSlice = createSlice({
  name: "split",
  initialState,
  reducers: {
    setSplitParticipants(state, action: PayloadAction<SplitParticipant[]>) {
      state.participants = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    setSplitExpenses(state, action: PayloadAction<SplitExpense[]>) {
      state.expenses = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearSplit(state) {
      state.participants = [];
      state.expenses = [];
      state.status = "idle";
      state.error = null;
    },
    markSplitLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addSplitParticipant.fulfilled, (state, action) => {
        state.participants = upsertById(state.participants, action.payload);
      })
      .addCase(deleteSplitParticipant.fulfilled, (state, action) => {
        state.participants = state.participants.filter((p) => p.id !== action.payload);
      })
      .addCase(addSplitExpense.fulfilled, (state, action) => {
        state.expenses = upsertById(state.expenses, action.payload);
      })
      .addCase(updateSplitExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        );
      })
      .addCase(deleteSplitExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      });
  },
});

export const {
  setSplitParticipants,
  setSplitExpenses,
  clearSplit,
  markSplitLoadFailed,
} = splitSlice.actions;
export default splitSlice.reducer;
