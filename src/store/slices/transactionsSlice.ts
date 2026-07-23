import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { FIRESTORE_QUERY } from "@constants/firestore";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Transaction } from "@/types";

interface TransactionsState {
  items: Transaction[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  /** True when another older page may exist on the server. */
  hasMore: boolean;
  loadingOlder: boolean;
  /** Set after a loadOlder page returns fewer than PAGE_SIZE rows. */
  olderExhausted: boolean;
}

const initialState: TransactionsState = {
  items: [],
  status: "idle",
  error: null,
  hasMore: false,
  loadingOlder: false,
  olderExhausted: false,
};

export const fetchTransactions = createAsyncThunk("transactions/fetch", async (userId: string) =>
  firestoreApi.fetchTransactions(userId),
);

export const loadOlderTransactions = createAsyncThunk(
  "transactions/loadOlder",
  async (userId: string, { getState }) => {
    const state = getState() as { transactions: TransactionsState };
    const oldest = state.transactions.items.reduce<string | null>((acc, t) => {
      const d = t.date || "";
      if (!d) return acc;
      if (!acc || d < acc) return d;
      return acc;
    }, null);
    if (!oldest) return [] as Transaction[];
    return firestoreApi.fetchOlderTransactions(userId, oldest);
  },
);

export const addTransaction = createAsyncThunk("transactions/add", async (tx: Transaction) =>
  firestoreApi.addTransaction(tx),
);

export const addTransactionsBulk = createAsyncThunk("transactions/addBulk", async (items: Transaction[]) =>
  firestoreApi.addTransactionsBulk(items),
);

export const updateTransaction = createAsyncThunk(
  "transactions/update",
  async ({ id, userId, patch }: { id: string; userId: string; patch: Partial<Transaction> }) =>
    firestoreApi.updateTransaction(id, userId, patch),
);

export const deleteTransaction = createAsyncThunk("transactions/delete", async (id: string) => {
  await firestoreApi.deleteTransaction(id);
  return id;
});

export const deleteImportedTransactions = createAsyncThunk("transactions/deleteImported", async (userId: string) =>
  firestoreApi.deleteImportedTransactions(userId),
);

export const deleteTransactionsByIds = createAsyncThunk("transactions/deleteByIds", async (ids: string[]) =>
  firestoreApi.deleteTransactionsByIds(ids),
);

function mergeWindowWithOlder(windowItems: Transaction[], existing: Transaction[]): Transaction[] {
  const windowIds = new Set(windowItems.map((t) => t.id));
  const oldestWindowDate = windowItems.reduce<string | null>((acc, t) => {
    const d = t.date || "";
    if (!d) return acc;
    if (!acc || d < acc) return d;
    return acc;
  }, null);

  const retained = existing.filter((t) => {
    if (windowIds.has(t.id)) return false;
    if (!oldestWindowDate) return true;
    return (t.date || "") < oldestWindowDate;
  });

  return [...windowItems, ...retained];
}

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    /**
     * Apply a recent-window snapshot from onSnapshot.
     * Keeps previously paginated older rows that fall outside the window.
     */
    setTransactions(state, action: PayloadAction<Transaction[]>) {
      const windowItems = action.payload;
      state.items = mergeWindowWithOlder(windowItems, state.items);
      if (windowItems.length < FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE) {
        state.hasMore = false;
        state.olderExhausted = true;
      } else {
        state.hasMore = !state.olderExhausted;
      }
      state.status = "succeeded";
      state.error = null;
    },
    clearTransactions(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.hasMore = false;
      state.loadingOlder = false;
      state.olderExhausted = false;
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
        const windowItems = action.payload;
        state.items = mergeWindowWithOlder(windowItems, state.items);
        if (windowItems.length < FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE) {
          state.olderExhausted = true;
          state.hasMore = false;
        } else {
          state.hasMore = !state.olderExhausted;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load transactions";
      })
      .addCase(loadOlderTransactions.pending, (state) => {
        state.loadingOlder = true;
      })
      .addCase(loadOlderTransactions.fulfilled, (state, action) => {
        state.loadingOlder = false;
        const incoming = action.payload;
        if (incoming.length < FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE) {
          state.olderExhausted = true;
          state.hasMore = false;
        } else {
          state.hasMore = true;
        }
        state.items = incoming.reduce((acc, item) => upsertById(acc, item), state.items);
      })
      .addCase(loadOlderTransactions.rejected, (state) => {
        state.loadingOlder = false;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(addTransactionsBulk.fulfilled, (state, action) => {
        state.items = action.payload.reduce((acc, item) => upsertById(acc, item), state.items);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.items = state.items.map((t) => (t.id === action.payload.id ? action.payload : t));
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteImportedTransactions.fulfilled, (state, action) => {
        const removed = new Set(action.payload);
        state.items = state.items.filter((t) => !removed.has(t.id));
      })
      .addCase(deleteTransactionsByIds.fulfilled, (state, action) => {
        const removed = new Set(action.payload);
        state.items = state.items.filter((t) => !removed.has(t.id));
      });
  },
});

export const { setTransactions, clearTransactions, markTransactionsLoadFailed } = transactionsSlice.actions;
export default transactionsSlice.reducer;
