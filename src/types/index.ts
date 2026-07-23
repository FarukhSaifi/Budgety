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
  /** Mark for tax / audit export. */
  taxDeductible?: boolean;
  /** Flag for shared / split expense flows. */
  isShared?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  currentAmount: number;
  period: BudgetPeriod;
  /** When true, unused limit carries into the next month. */
  rollover?: boolean;
  /** Accumulated rollover credit from prior periods. */
  rolloverBalance?: number;
  /** Legacy alias — mirrors `limitAmount`. */
  amount?: number;
  /** Legacy: month (1–12) for monthly budgets. */
  month?: number;
  /** Legacy: year for period scoping. */
  year?: number;
  createdAt?: string;
}

/** User-scoped category catalog stored in Firestore (no static app lists). */
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  /** Seeded defaults vs user-created. */
  isDefault?: boolean;
  createdAt?: string;
}

/** IF/THEN auto-categorization rule. */
export interface CategorizationRule {
  id: string;
  userId: string;
  name: string;
  /** Case-insensitive substring match against transaction title. */
  matchContains: string;
  category: string;
  transactionType?: TransactionType | "any";
  isActive: boolean;
  createdAt?: string;
}

export type DebtKind = "loan" | "credit_card" | "other";

export interface Debt {
  id: string;
  userId: string;
  title: string;
  kind: DebtKind;
  principal: number;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDay?: number;
  createdAt?: string;
}

export type DebtStrategy = "snowball" | "avalanche";

export interface SplitParticipant {
  id: string;
  userId: string;
  name: string;
}

export interface SplitExpense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  date: string;
  paidById: string;
  participantIds: string[];
  /** Optional link to a transaction id. */
  transactionId?: string | null;
  settled?: boolean;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
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
 * Secondary (reachable via Home/Profile/Analytics links): budgets | bills | goals
 * Reports live under Analytics (`AnalyticsTab` "reports").
 */
export type NavTab =
  | "overview"
  | "transactions"
  | "analytics"
  | "profile"
  | "budgets"
  | "bills"
  | "goals"
  | "debt"
  | "split"
  | "rules";

/** Transaction list filter pills (Transfer is UI-only; maps to transfer payment modes). */
export type TransactionFilter = "all" | "income" | "expense" | "transfer";

/** Analytics segmented control (includes former Reports screen). */
export type AnalyticsTab = "overview" | "income" | "outcome" | "budget" | "reports";

/** @deprecated Prefer Firestore `Category` docs via categoriesSlice. */
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
  /** @deprecated Kept temporarily for import bulk helpers; prefer categoriesSlice. */
  categories: CategoryState;
}
