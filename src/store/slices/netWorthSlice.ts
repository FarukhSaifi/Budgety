import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { NetWorthItem } from "@/types";

interface NetWorthState {
  items: NetWorthItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: NetWorthState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchNetWorthItems = createAsyncThunk("netWorth/fetch", async (userId: string) =>
  firestoreApi.fetchNetWorthItems(userId),
);

export const addNetWorthItem = createAsyncThunk("netWorth/add", async (item: NetWorthItem) =>
  firestoreApi.addNetWorthItem(item),
);

export const updateNetWorthItem = createAsyncThunk(
  "netWorth/update",
  async ({ id, userId, patch }: { id: string; userId: string; patch: Partial<NetWorthItem> }) =>
    firestoreApi.updateNetWorthItem(id, userId, patch),
);

export const deleteNetWorthItem = createAsyncThunk("netWorth/delete", async (id: string) => {
  await firestoreApi.deleteNetWorthItem(id);
  return id;
});

const netWorthSlice = createSlice({
  name: "netWorth",
  initialState,
  reducers: {
    setNetWorthItems(state, action: PayloadAction<NetWorthItem[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearNetWorth(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markNetWorthLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNetWorthItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(addNetWorthItem.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateNetWorthItem.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      })
      .addCase(deleteNetWorthItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const { setNetWorthItems, clearNetWorth, markNetWorthLoadFailed } = netWorthSlice.actions;
export default netWorthSlice.reducer;
