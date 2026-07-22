import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { VIEW_PERIODS, VIEW_TYPES } from "@constants";
import type { CategoryState, NavTab, UiFiltersState, ViewPeriod, ViewType } from "@/types";

const now = new Date();

const initialState: UiFiltersState = {
  activeTab: "overview",
  viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
  viewType: VIEW_TYPES.LIST as ViewType,
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  selectedCategory: "",
  searchQuery: "",
  categories: { income: [], expense: [] },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<NavTab>) {
      state.activeTab = action.payload;
      // Reset transient filters when switching sections for a clean context.
      state.searchQuery = "";
      state.selectedCategory = "";
    },
    setCategories(state, action: PayloadAction<CategoryState>) {
      state.categories = action.payload;
    },
    setViewPeriod(
      state,
      action: PayloadAction<{
        viewPeriod: ViewPeriod;
        selectedMonth?: number;
        selectedYear?: number;
      }>,
    ) {
      state.viewPeriod = action.payload.viewPeriod;
      if (action.payload.selectedMonth != null) {
        state.selectedMonth = action.payload.selectedMonth;
      }
      if (action.payload.selectedYear != null) {
        state.selectedYear = action.payload.selectedYear;
      }
    },
    setViewType(state, action: PayloadAction<ViewType>) {
      state.viewType = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string>) {
      state.selectedCategory = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    addCategory(
      state,
      action: PayloadAction<{ name: string; type: "income" | "expense" }>,
    ) {
      const trimmed = action.payload.name.trim().replace(/\s+/g, " ");
      if (!trimmed) return;
      const list = state.categories[action.payload.type];
      const exists = list.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        list.push(trimmed);
      }
    },
  },
});

export const {
  setActiveTab,
  setCategories,
  setViewPeriod,
  setViewType,
  setSelectedCategory,
  setSearchQuery,
  addCategory,
} = uiSlice.actions;
export default uiSlice.reducer;
