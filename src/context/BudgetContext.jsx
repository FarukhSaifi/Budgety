import { budgetyApi } from "@api/budgetyApi";
import { ACTION_TYPES, DEFAULT_STATE, ERROR_MESSAGES } from "@constants";
import { getCurrentMonthYear, nowISO } from "@utils/dateUtils";
import { showError } from "@utils/toast";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

const BudgetContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case ACTION_TYPES.ADD_TRANSACTIONS_BULK:
      return {
        ...state,
        transactions: [
          ...(Array.isArray(action.payload) ? action.payload : []),
          ...state.transactions,
        ],
      };
    case ACTION_TYPES.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload,
        ),
      };
    case ACTION_TYPES.DELETE_ALL_IMPORTED_TRANSACTIONS:
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => !transaction.imported,
        ),
      };
    case ACTION_TYPES.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id
            ? { ...transaction, ...action.payload }
            : transaction,
        ),
      };
    case ACTION_TYPES.ADD_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: [action.payload, ...state.savingsGoals],
      };
    case ACTION_TYPES.UPDATE_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: state.savingsGoals.map((goal) =>
          goal.id === action.payload.id ? { ...goal, ...action.payload } : goal,
        ),
      };
    case ACTION_TYPES.DELETE_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: state.savingsGoals.filter(
          (goal) => goal.id !== action.payload,
        ),
      };
    case ACTION_TYPES.SET_VIEW_PERIOD:
      return {
        ...state,
        viewPeriod: action.payload.viewPeriod,
        selectedMonth: action.payload.selectedMonth ?? state.selectedMonth,
        selectedYear: action.payload.selectedYear ?? state.selectedYear,
      };
    case ACTION_TYPES.SET_VIEW_TYPE:
      return {
        ...state,
        viewType: action.payload,
      };
    case ACTION_TYPES.SET_SELECTED_CATEGORY:
      return {
        ...state,
        selectedCategory: action.payload,
      };
    case ACTION_TYPES.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      };
    case ACTION_TYPES.ADD_BUDGET:
      return {
        ...state,
        budgets: [action.payload, ...state.budgets],
      };
    case ACTION_TYPES.UPDATE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.map((budget) =>
          budget.id === action.payload.id
            ? { ...budget, ...action.payload }
            : budget,
        ),
      };
    case ACTION_TYPES.DELETE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.filter((budget) => budget.id !== action.payload),
      };
    case ACTION_TYPES.ADD_RECURRING_TRANSACTION:
      return {
        ...state,
        recurringTransactions: [action.payload, ...state.recurringTransactions],
      };
    case ACTION_TYPES.UPDATE_RECURRING_TRANSACTION:
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.map((recurring) =>
          recurring.id === action.payload.id
            ? { ...recurring, ...action.payload }
            : recurring,
        ),
      };
    case ACTION_TYPES.DELETE_RECURRING_TRANSACTION:
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.filter(
          (recurring) => recurring.id !== action.payload,
        ),
      };
    case ACTION_TYPES.ADD_BILL_REMINDER:
      return {
        ...state,
        billReminders: [action.payload, ...state.billReminders],
      };
    case ACTION_TYPES.UPDATE_BILL_REMINDER:
      return {
        ...state,
        billReminders: state.billReminders.map((bill) =>
          bill.id === action.payload.id ? { ...bill, ...action.payload } : bill,
        ),
      };
    case ACTION_TYPES.DELETE_BILL_REMINDER:
      return {
        ...state,
        billReminders: state.billReminders.filter(
          (bill) => bill.id !== action.payload,
        ),
      };
    case ACTION_TYPES.MARK_BILL_PAID:
      return {
        ...state,
        billReminders: state.billReminders.map((bill) =>
          bill.id === action.payload
            ? { ...bill, isPaid: true, paidDate: nowISO() }
            : bill,
        ),
      };
    case ACTION_TYPES.RESTORE_STATE:
      return {
        ...state,
        transactions: action.payload.transactions ?? state.transactions,
        savingsGoals: action.payload.savingsGoals ?? state.savingsGoals,
        budgets: action.payload.budgets ?? state.budgets,
        recurringTransactions:
          action.payload.recurringTransactions ?? state.recurringTransactions,
        billReminders: action.payload.billReminders ?? state.billReminders,
      };
    default:
      return state;
  }
};

const persistAction = async (type, payload, api) => {
  switch (type) {
    case ACTION_TYPES.ADD_TRANSACTION:
      await api.addTransaction({
        id: payload.id,
        type: payload.type,
        date: payload.date,
        mode: payload.mode || "Cash",
        description: payload.description,
        category: payload.category,
        amount: payload.amount,
        createdAt: payload.createdAt,
        imported: payload.imported ?? false,
      });
      break;
    case ACTION_TYPES.ADD_TRANSACTIONS_BULK:
      if (Array.isArray(payload) && payload.length > 0) {
        await api.addTransactionsBulk(
          payload.map((t) => ({
            id: t.id,
            type: t.type,
            date: t.date,
            mode: t.mode || "Cash",
            description: t.description,
            category: t.category,
            amount: t.amount,
            createdAt: t.createdAt,
            imported: t.imported ?? true,
          })),
        );
      }
      break;
    case ACTION_TYPES.DELETE_TRANSACTION:
      await api.deleteTransaction(payload);
      break;
    case ACTION_TYPES.DELETE_ALL_IMPORTED_TRANSACTIONS:
      await api.deleteImportedTransactions();
      break;
    case ACTION_TYPES.UPDATE_TRANSACTION:
      await api.updateTransaction(payload.id, {
        type: payload.type,
        date: payload.date,
        mode: payload.mode,
        description: payload.description,
        category: payload.category,
        amount: payload.amount,
      });
      break;
    case ACTION_TYPES.ADD_SAVINGS_GOAL:
      await api.addSavingsGoal(payload);
      break;
    case ACTION_TYPES.UPDATE_SAVINGS_GOAL:
      await api.updateSavingsGoal(payload.id, payload);
      break;
    case ACTION_TYPES.DELETE_SAVINGS_GOAL:
      await api.deleteSavingsGoal(payload);
      break;
    case ACTION_TYPES.ADD_BUDGET:
      await api.addBudget(payload);
      break;
    case ACTION_TYPES.UPDATE_BUDGET:
      await api.updateBudget(payload.id, payload);
      break;
    case ACTION_TYPES.DELETE_BUDGET:
      await api.deleteBudget(payload);
      break;
    case ACTION_TYPES.ADD_RECURRING_TRANSACTION:
      await api.addRecurringTransaction(payload);
      break;
    case ACTION_TYPES.UPDATE_RECURRING_TRANSACTION:
      await api.updateRecurringTransaction(payload.id, payload);
      break;
    case ACTION_TYPES.DELETE_RECURRING_TRANSACTION:
      await api.deleteRecurringTransaction(payload);
      break;
    case ACTION_TYPES.ADD_BILL_REMINDER:
      await api.addBillReminder(payload);
      break;
    case ACTION_TYPES.UPDATE_BILL_REMINDER:
      await api.updateBillReminder(payload.id, payload);
      break;
    case ACTION_TYPES.DELETE_BILL_REMINDER:
      await api.deleteBillReminder(payload);
      break;
    case ACTION_TYPES.MARK_BILL_PAID:
      await api.updateBillReminder(payload, {
        isPaid: true,
        paidDate: nowISO(),
      });
      break;
    default:
      break;
  }
};

const PERSIST_TYPES = new Set([
  ACTION_TYPES.ADD_TRANSACTION,
  ACTION_TYPES.ADD_TRANSACTIONS_BULK,
  ACTION_TYPES.DELETE_TRANSACTION,
  ACTION_TYPES.DELETE_ALL_IMPORTED_TRANSACTIONS,
  ACTION_TYPES.UPDATE_TRANSACTION,
  ACTION_TYPES.ADD_SAVINGS_GOAL,
  ACTION_TYPES.UPDATE_SAVINGS_GOAL,
  ACTION_TYPES.DELETE_SAVINGS_GOAL,
  ACTION_TYPES.ADD_BUDGET,
  ACTION_TYPES.UPDATE_BUDGET,
  ACTION_TYPES.DELETE_BUDGET,
  ACTION_TYPES.ADD_RECURRING_TRANSACTION,
  ACTION_TYPES.UPDATE_RECURRING_TRANSACTION,
  ACTION_TYPES.DELETE_RECURRING_TRANSACTION,
  ACTION_TYPES.ADD_BILL_REMINDER,
  ACTION_TYPES.UPDATE_BILL_REMINDER,
  ACTION_TYPES.DELETE_BILL_REMINDER,
  ACTION_TYPES.MARK_BILL_PAID,
]);

export const BudgetProvider = ({ children }) => {
  const [state, dispatchReducer] = useReducer(reducer, DEFAULT_STATE, (s) => {
    const { month, year } = getCurrentMonthYear();
    return {
      ...s,
      selectedMonth: s.selectedMonth ?? month,
      selectedYear: s.selectedYear ?? year,
    };
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    budgetyApi
      .getState()
      .then((data) => {
        if (!cancelled && data) {
          dispatchReducer({ type: ACTION_TYPES.RESTORE_STATE, payload: data });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message);
          showError(ERROR_MESSAGES.LOAD_DATA_FAILED);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dispatch = useCallback(async (action) => {
    if (PERSIST_TYPES.has(action.type)) {
      try {
        await persistAction(action.type, action.payload, budgetyApi);
      } catch (err) {
        showError(err.message || ERROR_MESSAGES.SAVE_FAILED);
        throw err;
      }
    }
    dispatchReducer(action);
  }, []);

  const value = useMemo(
    () => ({
      transactions: state.transactions,
      savingsGoals: state.savingsGoals,
      budgets: state.budgets,
      recurringTransactions: state.recurringTransactions,
      billReminders: state.billReminders,
      viewPeriod: state.viewPeriod,
      viewType: state.viewType,
      selectedMonth: state.selectedMonth,
      selectedYear: state.selectedYear,
      selectedCategory: state.selectedCategory,
      searchQuery: state.searchQuery,
      dispatch,
      loading,
      loadError,
    }),
    [
      state.transactions,
      state.savingsGoals,
      state.budgets,
      state.recurringTransactions,
      state.billReminders,
      state.viewPeriod,
      state.viewType,
      state.selectedMonth,
      state.selectedYear,
      state.selectedCategory,
      state.searchQuery,
      dispatch,
      loading,
      loadError,
    ],
  );

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
