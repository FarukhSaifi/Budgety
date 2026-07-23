import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Debt, DebtStrategy } from "@/types";

interface DebtState {
  items: Debt[];
  strategy: DebtStrategy;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DebtState = {
  items: [],
  strategy: "snowball",
  status: "idle",
  error: null,
};

export const fetchDebts = createAsyncThunk("debt/fetch", async (userId: string) =>
  firestoreApi.fetchDebts(userId),
);

export const addDebt = createAsyncThunk("debt/add", async (debt: Debt) =>
  firestoreApi.addDebt(debt),
);

export const updateDebt = createAsyncThunk(
  "debt/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Debt>;
  }) => firestoreApi.updateDebt(id, userId, patch),
);

export const deleteDebt = createAsyncThunk("debt/delete", async (id: string) => {
  await firestoreApi.deleteDebt(id);
  return id;
});

const debtSlice = createSlice({
  name: "debt",
  initialState,
  reducers: {
    setDebts(state, action: PayloadAction<Debt[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearDebts(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    setDebtStrategy(state, action: PayloadAction<DebtStrategy>) {
      state.strategy = action.payload;
    },
    markDebtsLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDebts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(addDebt.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateDebt.fulfilled, (state, action) => {
        state.items = state.items.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        );
      })
      .addCase(deleteDebt.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      });
  },
});

export const { setDebts, clearDebts, setDebtStrategy, markDebtsLoadFailed } =
  debtSlice.actions;
export default debtSlice.reducer;
