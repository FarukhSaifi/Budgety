import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import billsReducer from "./slices/billsSlice";
import budgetsReducer from "./slices/budgetsSlice";
import goalsReducer from "./slices/goalsSlice";
import recurringReducer from "./slices/recurringSlice";
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
