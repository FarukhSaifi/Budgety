import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import billsReducer from "./slices/billsSlice";
import budgetsReducer from "./slices/budgetsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import chatReducer from "./slices/chatSlice";
import debtReducer from "./slices/debtSlice";
import goalsReducer from "./slices/goalsSlice";
import netWorthReducer from "./slices/netWorthSlice";
import recurringReducer from "./slices/recurringSlice";
import rulesReducer from "./slices/rulesSlice";
import splitReducer from "./slices/splitSlice";
import transactionsReducer from "./slices/transactionsSlice";
import uiReducer from "./slices/uiSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      transactions: transactionsReducer,
      budgets: budgetsReducer,
      bills: billsReducer,
      goals: goalsReducer,
      recurring: recurringReducer,
      categories: categoriesReducer,
      rules: rulesReducer,
      debt: debtReducer,
      netWorth: netWorthReducer,
      split: splitReducer,
      chat: chatReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
