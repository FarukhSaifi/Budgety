import { ACTION_TYPES, DEFAULT_STATE } from "@constants";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const BudgetContext = createContext();

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_TRANSACTION:
      // Add transaction to global state - this will be available to all components
      // (Dashboard, Budget, Reports, Charts, etc.) and persisted to localStorage
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case ACTION_TYPES.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        ),
      };
    case ACTION_TYPES.DELETE_ALL_IMPORTED_TRANSACTIONS:
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => !transaction.imported
        ),
      };
    case ACTION_TYPES.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id
            ? { ...transaction, ...action.payload }
            : transaction
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
          goal.id === action.payload.id ? { ...goal, ...action.payload } : goal
        ),
      };
    case ACTION_TYPES.DELETE_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: state.savingsGoals.filter(
          (goal) => goal.id !== action.payload
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
            : budget
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
            : recurring
        ),
      };
    case ACTION_TYPES.DELETE_RECURRING_TRANSACTION:
      return {
        ...state,
        recurringTransactions: state.recurringTransactions.filter(
          (recurring) => recurring.id !== action.payload
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
          bill.id === action.payload.id ? { ...bill, ...action.payload } : bill
        ),
      };
    case ACTION_TYPES.DELETE_BILL_REMINDER:
      return {
        ...state,
        billReminders: state.billReminders.filter(
          (bill) => bill.id !== action.payload
        ),
      };
    case ACTION_TYPES.MARK_BILL_PAID:
      return {
        ...state,
        billReminders: state.billReminders.map((bill) =>
          bill.id === action.payload
            ? { ...bill, isPaid: true, paidDate: new Date().toISOString() }
            : bill
        ),
      };
    default:
      return state;
  }
};

// Load data from localStorage on mount
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("budgetyState");

    if (serializedState === null) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(serializedState);
    // Ensure all required fields exist
    return {
      ...DEFAULT_STATE,
      ...parsed,
      transactions: parsed.transactions || [],
      savingsGoals: parsed.savingsGoals || [],
      budgets: parsed.budgets || [],
      recurringTransactions: parsed.recurringTransactions || [],
      billReminders: parsed.billReminders || [],
      searchQuery: parsed.searchQuery || "",
    };
  } catch {
    return DEFAULT_STATE;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("budgetyState", serializedState);
  } catch {
    // Silently fail - localStorage errors are non-critical
    // In production, you might want to log to an error tracking service
  }
};

export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, loadState());

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

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
    ]
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
