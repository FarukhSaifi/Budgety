import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { RecurringTransaction } from "@/types";

interface RecurringState {
  items: RecurringTransaction[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RecurringState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchRecurring = createAsyncThunk(
  "recurring/fetch",
  async (userId: string) => firestoreApi.fetchRecurring(userId),
);

export const addRecurring = createAsyncThunk(
  "recurring/add",
  async (item: RecurringTransaction) => firestoreApi.addRecurring(item),
);

export const updateRecurring = createAsyncThunk(
  "recurring/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<RecurringTransaction>;
  }) => firestoreApi.updateRecurring(id, userId, patch),
);

export const deleteRecurring = createAsyncThunk(
  "recurring/delete",
  async (id: string) => {
    await firestoreApi.deleteRecurring(id);
    return id;
  },
);

const recurringSlice = createSlice({
  name: "recurring",
  initialState,
  reducers: {
    setRecurring(state, action: PayloadAction<RecurringTransaction[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearRecurring(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markRecurringLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecurring.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRecurring.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRecurring.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load recurring";
      })
      .addCase(addRecurring.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateRecurring.fulfilled, (state, action) => {
        state.items = state.items.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        );
      })
      .addCase(deleteRecurring.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export const { setRecurring, clearRecurring, markRecurringLoadFailed } =
  recurringSlice.actions;
export default recurringSlice.reducer;
