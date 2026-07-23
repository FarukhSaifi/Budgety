import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { upsertById } from "@store/upsert";

import { firestoreApi } from "@/lib/firestore";
import type { Category, TransactionType } from "@/types";

interface CategoriesState {
  items: Category[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  seeded: boolean;
}

const initialState: CategoriesState = {
  items: [],
  status: "idle",
  error: null,
  seeded: false,
};

export const ensureDefaultCategories = createAsyncThunk(
  "categories/ensureDefaults",
  async (userId: string) => firestoreApi.ensureDefaultCategories(userId),
);

export const addCategoryDoc = createAsyncThunk(
  "categories/add",
  async (category: Category) => firestoreApi.addCategory(category),
);

export const addCategoriesBulk = createAsyncThunk(
  "categories/addBulk",
  async (items: Array<Omit<Category, "id"> & { id?: string }>) =>
    firestoreApi.addCategoriesBulk(items),
);

export const updateCategoryDoc = createAsyncThunk(
  "categories/update",
  async ({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: Partial<Category>;
  }) => firestoreApi.updateCategory(id, userId, patch),
);

export const deleteCategoryDoc = createAsyncThunk(
  "categories/delete",
  async (id: string) => {
    await firestoreApi.deleteCategory(id);
    return id;
  },
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<Category[]>) {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
      state.seeded = action.payload.length > 0;
    },
    clearCategories(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.seeded = false;
    },
    markCategoriesLoadFailed(state, action: PayloadAction<string>) {
      state.status = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ensureDefaultCategories.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
        state.seeded = true;
      })
      .addCase(addCategoryDoc.fulfilled, (state, action) => {
        state.items = upsertById(state.items, action.payload);
      })
      .addCase(addCategoriesBulk.fulfilled, (state, action) => {
        action.payload.forEach((item) => {
          state.items = upsertById(state.items, item);
        });
      })
      .addCase(updateCategoryDoc.fulfilled, (state, action) => {
        state.items = state.items.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        );
      })
      .addCase(deleteCategoryDoc.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });
  },
});

export const { setCategories, clearCategories, markCategoriesLoadFailed } =
  categoriesSlice.actions;

export function selectCategoryNamesByType(
  items: Category[],
  type: TransactionType,
): string[] {
  return items
    .filter((c) => c.type === type)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
}

export default categoriesSlice.reducer;
