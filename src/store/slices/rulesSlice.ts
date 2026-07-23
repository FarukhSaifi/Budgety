import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { CategorizationRule } from "@/types";

interface RulesState {
  items: CategorizationRule[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RulesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchRules = createAsyncThunk("rules/fetch", async (userId: string) =>
  firestoreApi.fetchRules(userId),
);

export const addRule = createAsyncThunk("rules/add", async (rule: CategorizationRule) =>
  firestoreApi.addRule(rule),
);

export const updateRule = createAsyncThunk(
  "rules/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<CategorizationRule>;
  }) => firestoreApi.updateRule(id, userId, patch),
);

export const deleteRule = createAsyncThunk("rules/delete", async (id: string) => {
  await firestoreApi.deleteRule(id);
  return id;
});

const rulesSlice = createSlice({
  name: "rules",
  initialState,
  reducers: {
    setRules(state, action: PayloadAction<CategorizationRule[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearRules(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
    markRulesLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRules.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRules.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load rules";
      })
      .addCase(addRule.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(updateRule.fulfilled, (state, action) => {
        state.items = state.items.map((r) =>
          r.id === action.payload.id ? action.payload : r,
        );
      })
      .addCase(deleteRule.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export const { setRules, clearRules, markRulesLoadFailed } = rulesSlice.actions;
export default rulesSlice.reducer;
