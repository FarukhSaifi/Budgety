import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Goal } from "@/types";

interface GoalsState {
  items: Goal[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: GoalsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchGoals = createAsyncThunk(
  "goals/fetch",
  async (userId: string) => firestoreApi.fetchGoals(userId),
);

export const addGoal = createAsyncThunk(
  "goals/add",
  async (goal: Goal) => firestoreApi.addGoal(goal),
);

export const updateGoal = createAsyncThunk(
  "goals/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Goal>;
  }) => firestoreApi.updateGoal(id, userId, patch),
);

export const deleteGoal = createAsyncThunk(
  "goals/delete",
  async (id: string) => {
    await firestoreApi.deleteGoal(id);
    return id;
  },
);

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    setGoals(state, action: PayloadAction<Goal[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearGoals(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markGoalsLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load goals";
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.items = state.items.map((g) =>
          g.id === action.payload.id ? action.payload : g,
        );
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g.id !== action.payload);
      });
  },
});

export const { setGoals, clearGoals, markGoalsLoadFailed } = goalsSlice.actions;
export default goalsSlice.reducer;
