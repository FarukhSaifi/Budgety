import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Bill } from "@/types";

interface BillsState {
  items: Bill[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BillsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchBills = createAsyncThunk(
  "bills/fetch",
  async (userId: string) => firestoreApi.fetchBills(userId),
);

export const addBill = createAsyncThunk(
  "bills/add",
  async (bill: Bill) => firestoreApi.addBill(bill),
);

export const updateBill = createAsyncThunk(
  "bills/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Bill>;
  }) => firestoreApi.updateBill(id, userId, patch),
);

export const deleteBill = createAsyncThunk(
  "bills/delete",
  async (id: string) => {
    await firestoreApi.deleteBill(id);
    return id;
  },
);

export const markBillPaid = createAsyncThunk(
  "bills/markPaid",
  async ({ id, userId }: { id: string; userId: string }) =>
    firestoreApi.updateBill(id, userId, {
      status: "paid",
      isPaid: true,
      paidDate: new Date().toISOString(),
    }),
);

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    setBills(state, action: PayloadAction<Bill[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearBills(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markBillsLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load bills";
      })
      .addCase(addBill.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        state.items = state.items.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        );
      })
      .addCase(markBillPaid.fulfilled, (state, action) => {
        state.items = state.items.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        );
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export const { setBills, clearBills, markBillsLoadFailed } = billsSlice.actions;
export default billsSlice.reducer;
