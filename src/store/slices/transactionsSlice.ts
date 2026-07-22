import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { firestoreApi } from "@/lib/firestore";
import { upsertById } from "@store/upsert";
import type { Transaction } from "@/types";

interface TransactionsState {
  items: Transaction[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (userId: string) => firestoreApi.fetchTransactions(userId),
);

export const addTransaction = createAsyncThunk(
  "transactions/add",
  async (tx: Transaction) => firestoreApi.addTransaction(tx),
);

export const addTransactionsBulk = createAsyncThunk(
  "transactions/addBulk",
  async (items: Transaction[]) => firestoreApi.addTransactionsBulk(items),
);

export const updateTransaction = createAsyncThunk(
  "transactions/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Transaction>;
  }) => firestoreApi.updateTransaction(id, userId, patch),
);

export const deleteTransaction = createAsyncThunk(
  "transactions/delete",
  async (id: string) => {
    await firestoreApi.deleteTransaction(id);
    return id;
  },
);

export const deleteImportedTransactions = createAsyncThunk(
  "transactions/deleteImported",
  async (userId: string) => firestoreApi.deleteImportedTransactions(userId),
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    /** Replace list from a real-time snapshot (onSnapshot in AuthGuard). */
    setTransactions(state, action: PayloadAction<Transaction[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearTransactions(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    /** Listener failed — keep existing items so refresh does not wipe data. */
    markTransactionsLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load transactions";
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(addTransactionsBulk.fulfilled, (state, action) => {
        state.items = action.payload.reduce(
          (acc, item) => upsertById(acc, item),
          state.items,
        );
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.items = state.items.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        );
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteImportedTransactions.fulfilled, (state, action) => {
        const removed = new Set(action.payload);
        state.items = state.items.filter((t) => !removed.has(t.id));
      });
  },
});

export const { setTransactions, clearTransactions, markTransactionsLoadFailed } =
  transactionsSlice.actions;
export default transactionsSlice.reducer;
