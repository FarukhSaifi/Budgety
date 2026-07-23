import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { VIEW_PERIODS, VIEW_TYPES } from "@constants";

import { todayStorage } from "@utils/dateUtils";

import type { CategoryState, NavTab, TransactionFilter, UiFiltersState, ViewPeriod, ViewType } from "@/types";

const now = new Date();
const today = todayStorage();

const initialState: UiFiltersState = {
  activeTab: "overview",
  viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
  viewType: VIEW_TYPES.LIST as ViewType,
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  rangeStart: today,
  rangeEnd: today,
  selectedCategory: "",
  searchQuery: "",
  typeFilter: "all",
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
        rangeStart?: string;
        rangeEnd?: string;
      }>,
    ) {
      state.viewPeriod = action.payload.viewPeriod;
      if (action.payload.selectedMonth != null) {
        state.selectedMonth = action.payload.selectedMonth;
      }
      if (action.payload.selectedYear != null) {
        state.selectedYear = action.payload.selectedYear;
      }
      if (action.payload.rangeStart != null) {
        state.rangeStart = action.payload.rangeStart;
      }
      if (action.payload.rangeEnd != null) {
        state.rangeEnd = action.payload.rangeEnd;
      }
    },
    setDateRange(state, action: PayloadAction<{ rangeStart: string; rangeEnd: string }>) {
      state.viewPeriod = VIEW_PERIODS.RANGE as ViewPeriod;
      state.rangeStart = action.payload.rangeStart;
      state.rangeEnd = action.payload.rangeEnd;
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
    setTypeFilter(state, action: PayloadAction<TransactionFilter>) {
      state.typeFilter = action.payload;
    },
    addCategory(state, action: PayloadAction<{ name: string; type: "income" | "expense" }>) {
      const trimmed = action.payload.name.trim().replace(/\s+/g, " ");
      if (!trimmed) return;
      const list = state.categories[action.payload.type];
      const exists = list.some((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        list.push(trimmed);
      }
    },
    addCategoriesBulk(
      state,
      action: PayloadAction<{
        income?: string[];
        expense?: string[];
      }>,
    ) {
      const pushUnique = (list: string[], names: string[] | undefined) => {
        (names ?? []).forEach((name) => {
          const trimmed = String(name ?? "")
            .trim()
            .replace(/\s+/g, " ");
          if (!trimmed) return;
          if (!list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            list.push(trimmed);
          }
        });
      };
      pushUnique(state.categories.income, action.payload.income);
      pushUnique(state.categories.expense, action.payload.expense);
    },
  },
});

export const {
  setActiveTab,
  setCategories,
  setViewPeriod,
  setDateRange,
  setViewType,
  setSelectedCategory,
  setSearchQuery,
  setTypeFilter,
  addCategory,
  addCategoriesBulk,
} = uiSlice.actions;
export default uiSlice.reducer;
