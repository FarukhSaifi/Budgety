export type TransactionType = "income" | "expense";
/**
 * Reconciliation: the required baseline PaymentMode is
 * `'Cash' | 'Card' | 'UPI' | 'Net Banking'`. The legacy app supports many more
 * modes (see TRANSACTION_MODES in @constants), so the union is extended here so
 * the transaction modal keeps every option and no feature is dropped.
 */
export type PaymentMode =
  | "Cash"
  | "Card"
  | "UPI"
  | "Net Banking"
  | "Cheque"
  | "Bank Transfer"
  | "Wallet"
  | "NEFT"
  | "IMPS"
  | "RTGS"
  | "Other";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";
export type BillStatus = "paid" | "pending" | "overdue";
export type BudgetPeriod = "monthly" | "yearly";

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  isRecurring: boolean;
  /** Legacy alias used by existing UI — mirrors `title`. */
  description?: string;
  /** Legacy alias used by existing UI — mirrors `paymentMode`. */
  mode?: string;
  createdAt?: string;
  imported?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  currentAmount: number;
  period: BudgetPeriod;
  /** Legacy alias — mirrors `limitAmount`. */
  amount?: number;
  /** Legacy: month (1–12) for monthly budgets. */
  month?: number;
  /** Legacy: year for period scoping. */
  year?: number;
  createdAt?: string;
}

export interface Bill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: string;
  recurrence: RecurrenceType;
  status: BillStatus;
  /** Legacy fields preserved for calendar / reminders UI. */
  name?: string;
  isPaid?: boolean;
  paidDate?: string | null;
  isRecurring?: boolean;
  reminderDays?: number;
  category?: string;
  createdAt?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  /** Legacy alias — mirrors `title`. */
  name?: string;
  /** Legacy alias — mirrors `savedAmount`. */
  currentAmount?: number;
  createdAt?: string;
}

/** Legacy recurring payment templates (Bills & Recurring feature). */
export interface RecurringTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  recurrence: RecurrenceType;
  startDate: string;
  endDate?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ViewPeriod = "monthly" | "yearly" | "all";
export type ViewType = "list" | "calendar";

/**
 * Navigation sections.
 * Primary Stitch shell (bottom nav): overview | transactions | analytics | profile
 * Secondary (reachable via Home/Profile/Analytics links): budgets | bills | reports | goals
 */
export type NavTab =
  | "overview"
  | "transactions"
  | "analytics"
  | "profile"
  | "budgets"
  | "bills"
  | "reports"
  | "goals";

/** Transaction list filter pills (Transfer is UI-only; maps to transfer payment modes). */
export type TransactionFilter = "all" | "income" | "expense" | "transfer";

/** Analytics segmented control. */
export type AnalyticsTab = "overview" | "income" | "outcome" | "budget";

export interface CategoryState {
  income: string[];
  expense: string[];
}

export interface UiFiltersState {
  activeTab: NavTab;
  viewPeriod: ViewPeriod;
  viewType: ViewType;
  selectedMonth: number;
  selectedYear: number;
  selectedCategory: string;
  searchQuery: string;
  categories: CategoryState;
}
