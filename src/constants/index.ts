// Action Types
export const ACTION_TYPES = {
  ADD_TRANSACTION: "ADD_TRANSACTION",
  ADD_TRANSACTIONS_BULK: "ADD_TRANSACTIONS_BULK",
  DELETE_TRANSACTION: "DELETE_TRANSACTION",
  DELETE_ALL_IMPORTED_TRANSACTIONS: "DELETE_ALL_IMPORTED_TRANSACTIONS",
  UPDATE_TRANSACTION: "UPDATE_TRANSACTION",
  ADD_SAVINGS_GOAL: "ADD_SAVINGS_GOAL",
  UPDATE_SAVINGS_GOAL: "UPDATE_SAVINGS_GOAL",
  DELETE_SAVINGS_GOAL: "DELETE_SAVINGS_GOAL",
  ADD_BUDGET: "ADD_BUDGET",
  UPDATE_BUDGET: "UPDATE_BUDGET",
  DELETE_BUDGET: "DELETE_BUDGET",
  ADD_RECURRING_TRANSACTION: "ADD_RECURRING_TRANSACTION",
  UPDATE_RECURRING_TRANSACTION: "UPDATE_RECURRING_TRANSACTION",
  DELETE_RECURRING_TRANSACTION: "DELETE_RECURRING_TRANSACTION",
  ADD_BILL_REMINDER: "ADD_BILL_REMINDER",
  UPDATE_BILL_REMINDER: "UPDATE_BILL_REMINDER",
  DELETE_BILL_REMINDER: "DELETE_BILL_REMINDER",
  MARK_BILL_PAID: "MARK_BILL_PAID",
  SET_VIEW_PERIOD: "SET_VIEW_PERIOD",
  SET_VIEW_TYPE: "SET_VIEW_TYPE",
  SET_SELECTED_CATEGORY: "SET_SELECTED_CATEGORY",
  SET_SEARCH_QUERY: "SET_SEARCH_QUERY",
  ADD_CATEGORY: "ADD_CATEGORY",
  RESTORE_STATE: "RESTORE_STATE",
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
} as const;

// Transaction Type Labels
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.INCOME]: "Income",
  [TRANSACTION_TYPES.EXPENSE]: "Expense",
};

// Transaction Modes (Payment Methods) — primary modes match PaymentMode type
export const TRANSACTION_MODES = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  NET_BANKING: "Net Banking",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  NEFT: "NEFT",
  IMPS: "IMPS",
  RTGS: "RTGS",
  OTHER: "Other",
};

/** Primary payment modes for forms (aligned with Firestore PaymentMode). */
export const PRIMARY_PAYMENT_MODES = [
  TRANSACTION_MODES.CASH,
  TRANSACTION_MODES.CARD,
  TRANSACTION_MODES.UPI,
  TRANSACTION_MODES.NET_BANKING,
];

// Transaction Mode Labels
export const TRANSACTION_MODE_LABELS = {
  [TRANSACTION_MODES.CASH]: "Cash",
  [TRANSACTION_MODES.CARD]: "Card",
  [TRANSACTION_MODES.UPI]: "UPI",
  [TRANSACTION_MODES.NET_BANKING]: "Net Banking",
  [TRANSACTION_MODES.CHEQUE]: "Cheque",
  [TRANSACTION_MODES.BANK_TRANSFER]: "Bank Transfer",
  [TRANSACTION_MODES.WALLET]: "Wallet",
  [TRANSACTION_MODES.NEFT]: "NEFT",
  [TRANSACTION_MODES.IMPS]: "IMPS",
  [TRANSACTION_MODES.RTGS]: "RTGS",
  [TRANSACTION_MODES.OTHER]: "Other",
};

// Bank Statement Transaction Codes/Legends
export const TRANSACTION_CODES = {
  INFT: "Internal Fund Transfer (Within Bank)",
  BPAY: "Bill Payment",
  BBPS: "Bharat Bill Payment Service",
  NEFT: "National Electronics Funds Transfer System",
  RCHG: "Recharge",
  ONL: "Online Shopping Transaction",
  SMO: "Smart Money Order",
  DTAX: "Direct Tax",
  IDTX: "Indirect Tax",
  PAVC: "Pay any Visa Credit Card",
  PAC: "Personal Accident Cover",
  LNPY: "Linked Loan Payment",
  CCWD: "Cardless Cash Withdrawal",
  PAYC: "Pay to Contact",
  IMPS: "Immediate Payment Service",
  VAT: "Cash Withdrawal at Other Bank ATM",
  MAT: "Cash Withdrawal at Other Bank ATM",
  NFS: "Cash Withdrawal at Other Bank ATM",
  INF: "Internet Fund Transfer",
  EBA: "Transaction on Bank Direct",
  BIL: "Internet Bill Payment or Funds Transfer",
  VPS: "Debit Card Transaction",
  IPS: "Debit Card Transaction",
  TOP: "Mobile Recharge",
  BCTT: "Banking Cash Transaction Tax",
  UCCBRN: "Upcountry Cheque Collection",
  LCCBRN: "Local Cheque Collection",
  NCHG: "NEFT Charges",
  MMT: "Mobile Money Transfer (Insta FT - IMPS)",
  TCHG: "Travel Charges",
  UPI: "Unified Payments Interface",
};

// Transaction Code Detection Patterns
export const TRANSACTION_CODE_PATTERNS = {
  UPI: /UPI/i,
  NEFT: /NEFT/i,
  IMPS: /IMPS|MMT/i,
  RTGS: /RTGS/i,
  INFT: /INFT|Internal Fund Transfer/i,
  BPAY: /BPAY|Bill Payment/i,
  BBPS: /BBPS|Bharat Bill Payment/i,
  RCHG: /RCHG|Recharge|TOP/i,
  ONL: /ONL|Online Shopping/i,
  SMO: /SMO|Smart Money/i,
  DTAX: /DTAX|Direct Tax/i,
  IDTX: /IDTX|Indirect Tax/i,
  PAVC: /PAVC|Visa Credit/i,
  PAC: /PAC|Personal Accident/i,
  LNPY: /LNPY|Loan Payment/i,
  CCWD: /CCWD|Cardless Cash/i,
  PAYC: /PAYC|Pay to Contact/i,
  VAT: /VAT|MAT|NFS|ATM/i,
  INF: /INF|Internet Fund/i,
  EBA: /EBA|Bank Direct/i,
  BIL: /BIL|Internet Bill/i,
  VPS: /VPS|IPS|Debit Card/i,
  TOP: /TOP|Mobile Recharge/i,
  BCTT: /BCTT|Banking Cash Transaction/i,
  UCCBRN: /UCCBRN|Upcountry Cheque/i,
  LCCBRN: /LCCBRN|Local Cheque/i,
  NCHG: /N chg|NEFT Charges/i,
  MMT: /MMT|Mobile Money/i,
  TCHG: /T Chg|Travel Charges/i,
};

// Income Categories
export const INCOME_CATEGORIES = {
  SALARY: "Salary",
  FREELANCE: "Freelance",
  INVESTMENT: "Investment",
  BUSINESS: "Business",
  RENTAL: "Rental Income",
  BONUS: "Bonus",
  OTHER: "Other",
};

// Expense Categories (sorted alphabetically by display value)
export const EXPENSE_CATEGORIES = {
  BONDS: "Bonds",
  DINING: "Dining Out",
  EDUCATION: "Education",
  ELSS: "ELSS",
  ENTERTAINMENT: "Entertainment",
  ETF: "ETF",
  GIFTS: "Gifts & Donations",
  GROCERIES: "Groceries",
  HEALTHCARE: "Healthcare",
  HOME_EXPENSE: "Home Expense",
  HOUSING: "Housing",
  INSURANCE: "Insurance",
  INVESTMENTS: "Investments",
  LOAN_PAYMENTS: "Loan Payments",
  MISC_EXPENSES: "Miscellaneous Expenses",
  MUTUAL_FUNDS: "Mutual Funds",
  NPS: "NPS",
  OTHER: "Other",
  PERSONAL_CARE: "Personal Care",
  PPF: "PPF",
  REIT: "REIT",
  SHOPPING: "Shopping",
  SIP: "SIP",
  SUBSCRIPTIONS: "Subscriptions",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  UTILITIES: "Utilities",
  CREDIT_CARD: "Credit Card",
};

export const INVESTMENT_CATEGORIES = {
  STOCKS: "Stocks",
  BONDS: "Bonds",
  MUTUAL_FUNDS: "Mutual Funds",
  ETF: "ETF",
  REITS: "REITS",
  P2P: "P2P",
  CRYPTO: "Crypto",
  PPF: "PPF",
  OTHER: "Other",
};

// Sorted expense categories array for dropdowns (alphabetically sorted)
export const SORTED_EXPENSE_CATEGORIES = Object.values(EXPENSE_CATEGORIES).sort();

// Category Colors for Charts
export const CATEGORY_COLORS = {
  [INCOME_CATEGORIES.SALARY]: "#28b9b5",
  [INCOME_CATEGORIES.FREELANCE]: "#2ecc71",
  [INCOME_CATEGORIES.INVESTMENT]: "#3498db",
  [INCOME_CATEGORIES.BUSINESS]: "#9b59b6",
  [INCOME_CATEGORIES.RENTAL]: "#1abc9c",
  [INCOME_CATEGORIES.BONUS]: "#16a085",
  [INCOME_CATEGORIES.OTHER]: "#95a5a6",
  [EXPENSE_CATEGORIES.BONDS]: "#8e44ad",
  [EXPENSE_CATEGORIES.DINING]: "#e91e63",
  [EXPENSE_CATEGORIES.EDUCATION]: "#34495e",
  [EXPENSE_CATEGORIES.ELSS]: "#16a085",
  [EXPENSE_CATEGORIES.ENTERTAINMENT]: "#9b59b6",
  [EXPENSE_CATEGORIES.ETF]: "#27ae60",
  [EXPENSE_CATEGORIES.GIFTS]: "#9c27b0",
  [EXPENSE_CATEGORIES.GROCERIES]: "#f39c12",
  [EXPENSE_CATEGORIES.HEALTHCARE]: "#e67e22",
  [EXPENSE_CATEGORIES.HOME_EXPENSE]: "#c17f59",
  [EXPENSE_CATEGORIES.HOUSING]: "#e74c3c",
  [EXPENSE_CATEGORIES.INSURANCE]: "#607d8b",
  [EXPENSE_CATEGORIES.INVESTMENTS]: "#3498db",
  [EXPENSE_CATEGORIES.LOAN_PAYMENTS]: "#c0392b",
  [EXPENSE_CATEGORIES.MISC_EXPENSES]: "#95a5a6",
  [EXPENSE_CATEGORIES.MUTUAL_FUNDS]: "#2980b9",
  [EXPENSE_CATEGORIES.NPS]: "#1abc9c",
  [EXPENSE_CATEGORIES.OTHER]: "#d2d2d2",
  [EXPENSE_CATEGORIES.PERSONAL_CARE]: "#ff9800",
  [EXPENSE_CATEGORIES.PPF]: "#16a085",
  [EXPENSE_CATEGORIES.REIT]: "#27ae60",
  [EXPENSE_CATEGORIES.SHOPPING]: "#ff5722",
  [EXPENSE_CATEGORIES.SIP]: "#2980b9",
  [EXPENSE_CATEGORIES.SUBSCRIPTIONS]: "#795548",
  [EXPENSE_CATEGORIES.TRANSPORTATION]: "#3498db",
  [EXPENSE_CATEGORIES.TRAVEL]: "#00bcd4",
  [EXPENSE_CATEGORIES.UTILITIES]: "#1abc9c",
  [EXPENSE_CATEGORIES.CREDIT_CARD]: "#ff5767",
  [INVESTMENT_CATEGORIES.STOCKS]: "#1565c0",
  [INVESTMENT_CATEGORIES.REITS]: "#00897b",
  [INVESTMENT_CATEGORIES.P2P]: "#6d4c41",
  [INVESTMENT_CATEGORIES.CRYPTO]: "#f9a825",
};

// Fallback for category tags when category is not in CATEGORY_COLORS (e.g. user-added)
export const DEFAULT_CATEGORY_TAG_COLOR = "#f2f2f2";

// View Periods
export const VIEW_PERIODS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  ALL: "all",
} as const;

/** localStorage key for dashboard period (viewPeriod / month / year). */
export const UI_PERIOD_STORAGE_KEY = "budgety.ui.period";

/** Sentinel value in category selects for opening the “add category” flow. */
export const ADD_CATEGORY_OPTION_VALUE = "__ADD_NEW_CATEGORY__";

// View Period Labels
export const VIEW_PERIOD_LABELS = {
  [VIEW_PERIODS.MONTHLY]: "Monthly",
  [VIEW_PERIODS.YEARLY]: "Yearly",
  [VIEW_PERIODS.ALL]: "All Time",
};

// View Types
export const VIEW_TYPES = {
  LIST: "list",
  CALENDAR: "calendar",
} as const;

// View Type Labels
export const VIEW_TYPE_LABELS = {
  [VIEW_TYPES.LIST]: "List View",
  [VIEW_TYPES.CALENDAR]: "Calendar View",
};

// View control variants (which section is using the controls)
export const VIEW_CONTROL_VARIANTS = {
  TRANSACTIONS: "transactions",
  BUDGETS: "budgets",
  BILLS: "bills",
  REPORTS: "reports",
};

// View control config per variant: which search/filters to show
export const VIEW_CONTROL_CONFIG = {
  [VIEW_CONTROL_VARIANTS.TRANSACTIONS]: {
    showSearch: true,
    showViewType: true,
    showCategoryFilter: true,
    showPeriodFilter: true,
  },
  [VIEW_CONTROL_VARIANTS.BUDGETS]: {
    showSearch: false,
    showViewType: false,
    showCategoryFilter: false,
    showPeriodFilter: true,
  },
  [VIEW_CONTROL_VARIANTS.BILLS]: {
    showSearch: true,
    showViewType: false,
    showCategoryFilter: false,
    showPeriodFilter: true,
  },
  [VIEW_CONTROL_VARIANTS.REPORTS]: {
    showSearch: true,
    showViewType: false,
    showCategoryFilter: false,
    showPeriodFilter: true,
  },
};

// UI Text
export const UI_TEXT = {
  AVAILABLE_BUDGET: "Available Budget",
  NET_SAVINGS: "Net Savings",
  TOTAL_INCOME: "Total Income",
  TOTAL_EXPENSES: "Total Expenses",
  INCOME: "Income",
  EXPENSE: "Expense",
  CHOOSE: "Choose",
  DESCRIPTION_PLACEHOLDER: "Description",
  AMOUNT_PLACEHOLDER: "Amount",
  DATE_PLACEHOLDER: "Date",
  CATEGORY_PLACEHOLDER: "Category",
  SEARCH_OR_SELECT_CATEGORY: "Search or select category...",
  ADD_AS_NEW_CATEGORY: 'Add "%s" as new category',
  ADD_NEW_CATEGORY_TITLE: "Add new category",
  ADD_NEW_CATEGORY_LABEL: "Category name",
  ADD_NEW_CATEGORY_PLACEHOLDER: "Enter category name",
  ADD_CATEGORY_OPTION: "+ Add category",
  ADD_CATEGORY_TYPE_HINT: "This category will be available for {type} transactions.",
  SUGGEST_WITH_AI: "Suggest with AI",
  SUGGEST_CATEGORY_LOADING: "Suggesting…",
  SUGGEST_CATEGORY_APPLIED: "Suggested: {category}",
  SUGGEST_CATEGORY_FAILED: "Could not suggest a category. Enter one manually.",
  SUGGEST_CATEGORY_UNAVAILABLE: "AI suggestions unavailable. Enter a category manually.",
  CATEGORY_CREATED: "Category “{name}” added",
  BILL_NAME_PLACEHOLDER: "e.g., Electricity Bill",
  ADD_NEW_CATEGORY_REQUIRED: "Please enter a category name",
  MODE_PLACEHOLDER: "Mode",
  TYPE_LABEL: "Type",
  MODE_LABEL: "Mode",
  INCOME_SYMBOL: "+",
  EXPENSE_SYMBOL: "-",
  ADD_TRANSACTION: "Add Transaction",
  ADD_GOAL: "Add Savings Goal",
  SAVINGS_GOALS: "Savings Goals",
  GOAL_NAME: "Goal Name",
  TARGET_AMOUNT: "Target Amount",
  CURRENT_AMOUNT: "Current Amount",
  PROGRESS: "Progress",
  TRANSACTIONS: "Transactions",
  NO_TRANSACTIONS: "No transactions yet. Add your first transaction!",
  NO_GOALS: "No savings goals yet. Create your first goal!",
  MONTHLY_BREAKDOWN: "Monthly Breakdown",
  YEARLY_BREAKDOWN: "Yearly Breakdown",
  SPENDING_BY_CATEGORY: "Spending by Category",
  INCOME_BY_CATEGORY: "Income by Category",
  SELECT_MONTH: "Select Month",
  SELECT_YEAR: "Select Year",
  DELETE: "Delete",
  EDIT: "Edit",
  EDIT_TRANSACTION: "Edit Transaction",
  SAVE: "Save",
  CANCEL: "Cancel",
  CONFIRM: "Confirm",
  SIGN_IN: "Sign in",
  SIGN_UP: "Sign up",
  SIGN_OUT: "Sign out",
  EMAIL: "Email",
  PASSWORD: "Password",
  NAME: "Name",
  AUTH_SIGN_IN_TITLE: "Sign in to Budgety",
  AUTH_SIGN_UP_TITLE: "Create your account",
  AUTH_NO_ACCOUNT: "Don't have an account?",
  AUTH_HAVE_ACCOUNT: "Already have an account?",
  AUTH_ERROR_INVALID_CREDENTIALS: "Invalid email or password",
  AUTH_ERROR_EMAIL_IN_USE: "This email is already registered",
  AUTH_ERROR_WEAK_PASSWORD: "Password should be at least 6 characters",
  AUTH_ERROR_INVALID_EMAIL: "Please enter a valid email address",
  AUTH_ERROR_TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
  AUTH_ERROR_POPUP_CLOSED: "Sign in was cancelled",
  AUTH_ERROR_POPUP_BLOCKED:
    "Sign-in popup was blocked. Allow popups for this site, or try again — we will use a full-page Google sign-in.",
  AUTH_ERROR_UNAUTHORIZED_DOMAIN:
    "This site is not authorized for Firebase Auth. Add your Vercel domain under Firebase → Authentication → Settings → Authorized domains.",
  AUTH_ERROR_REDIRECT_FAILED:
    "Google sign-in could not finish after redirect. Allow popups for this site and try again, or confirm the Vercel domain is authorized in Firebase Auth.",
  AUTH_ERROR_NETWORK: "Network error. Check your connection and try again.",
  AUTH_ERROR_NOT_CONFIGURED: "Authentication is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.",
  AUTH_SUCCESS_SIGNED_IN: "Signed in successfully",
  AUTH_SUCCESS_SIGNED_UP: "Account created successfully",
  AUTH_SUCCESS_SIGNED_OUT: "Signed out",
  AUTH_NAME_PLACEHOLDER: "Your name",
  AUTH_EMAIL_PLACEHOLDER: "you@example.com",
  AUTH_PASSWORD_HINT: "At least 6 characters",
  AUTH_GENERIC_ERROR: "Something went wrong",
  AUTH_CONTINUE_WITH_GOOGLE: "Continue with Google",
  AUTH_OR: "or",
  SELECT_PERIOD: "Select Period",
  VIEW_PERIOD_LABEL_SHORT: "View Period",
  MONTH_LABEL: "Month",
  MONTHLY_LABEL: "Monthly",
  OUTCOME_ANALYTICS: "Outcome Analytics",
  YEAR_LABEL: "Year",
  DONE: "Done",
  RECURRING_TRANSACTIONS: "Recurring Transactions",
  ADD_RECURRING: "Add Recurring Transaction",
  BILL_REMINDERS: "Bill Reminders",
  ADD_BILL: "Add Bill Reminder",
  MARK_AS_PAID: "Mark as Paid",
  BUDGETS: "Budgets",
  MONTHLY_BUDGETS: "Monthly Budgets",
  YEARLY_BUDGETS: "Yearly Budgets",
  BUDGETS_SUBTITLE: "Track your spending across categories.",
  TOTAL_SPENT: "Total Spent",
  LIMIT_LABEL: "Limit",
  USED_LABEL: "Used",
  BUDGET_STATUS_GOOD: "Good",
  BUDGET_STATUS_NEAR_LIMIT: "Near Limit",
  BUDGET_STATUS_OVER: "Over",
  ADD_CATEGORY_BUDGET: "Add Category",
  ADD_BUDGET: "Add Budget",
  BUDGET_LIMIT: "Budget Limit",
  SPENT: "Spent",
  REMAINING: "Remaining",
  REPORTS: "Reports & Analysis",
  BUDGET_VS_ACTUAL: "Budget vs Actual",
  SPENDING_TRENDS: "Spending Trends",
  CATEGORY_ANALYSIS: "Category Analysis",
  EXPENSE_FORECAST: "Expense Forecast",
  ADD_BILL_REMINDER_TITLE: "Add Bill Reminder",
  ADD_NEW_BUDGET_TITLE: "Add New Budget",
  ADD_NEW_SAVINGS_GOAL_TITLE: "Add New Savings Goal",
  ADD_RECURRING_TRANSACTION_TITLE: "Add Recurring Transaction",
  COMPREHENSIVE_FINANCIAL_ANALYSIS: "Comprehensive financial analysis and insights",
  REPORTS_SUBTITLE: "Deep dive into your financial health and future projections.",
  THIS_MONTH: "This Month",
  EXPORT_CSV: "Export CSV",
  BUDGET_ADHERENCE: "Budget Adherence",
  ADHERENCE_SCORE: "{score}% Score",
  INCOME_VS_EXPENSES: "Income vs. Expenses",
  SMART_INSIGHTS: "Smart Insights",
  SMART_INSIGHTS_BETA: "BETA",
  SMART_INSIGHTS_EMPTY: "Add more transactions this month to unlock personalized insights.",
  REFRESH_INSIGHTS: "Refresh Insights",
  REVIEW_BUDGETS: "Review Budgets",
  VIEW_TRANSACTIONS: "View Transactions",
  CATEGORY_LIMITS: "Category Limits",
  CATEGORY_SPEND: "Category Spend",
  WITHIN_BUDGET: "Within Budget",
  NEXT_3_MONTHS_PROJECTED: "Next 3 Months (Projected)",
  FORECAST_ESTIMATE: "Est. {amount}",
  APPLY_SUGGESTION: "Apply Suggestion",
  INSIGHT_OVERSPEND_TITLE: "Budget Overspend",
  INSIGHT_SAVINGS_TITLE: "Savings Opportunity",
  INSIGHT_CATEGORY_SHIFT_TITLE: "Category Shift",
  INSIGHT_STEADY_TITLE: "Steady Pace",
  NO_SPENDING_DATA: "No spending data available",
  NO_DATA_AVAILABLE: "No data available",
  CATEGORY_BREAKDOWN: "Category Breakdown",
  MONTHLY_TREND: "Monthly Trend",
  CONFIRM_DELETE_TRANSACTION: "Are you sure you want to delete this transaction?",
  CONFIRM_DELETE_GOAL: "Are you sure you want to delete this savings goal?",
  CONFIRM_DELETE_RECURRING: "Are you sure you want to delete this recurring transaction?",
  CONFIRM_DELETE_BUDGET: "Are you sure you want to delete this budget?",
  CONFIRM_DELETE_BILL: "Are you sure you want to delete this bill reminder?",
  CONFIRM_ACTION: "Confirm Action",
  CONFIRM_DEFAULT_MESSAGE: "Are you sure you want to proceed?",
  DELETE_TRANSACTION_TITLE: "Delete Transaction",
  DELETE_BUDGET_TITLE: "Delete Budget",
  DELETE_GOAL_TITLE: "Delete Savings Goal",
  DELETE_BILL_TITLE: "Delete Bill Reminder",
  DELETE_RECURRING_TITLE: "Delete Recurring Transaction",
  CLEANUP_IMPORTED_DATA: "Cleanup Imported Data",
  CLEANUP_IMPORTED_DESCRIPTION:
    "This will permanently delete all transactions that were imported from files. This action cannot be undone.",
  CONFIRM_CLEANUP_IMPORTED: "Are you sure you want to delete all imported transactions? This action cannot be undone.",
  CLEANUP_IMPORTED_TITLE: "Delete All Imported Transactions",
  NO_IMPORTED_TRANSACTIONS: "No imported transactions found.",
  CLEANUP_SUCCESS: "Successfully deleted {count} imported transaction(s).",
  GOAL_ACHIEVED: "Goal Achieved! 🎉",
  UPDATE_AMOUNT: "Update amount",
  NO_END_DATE: "No end date",
  PAUSE: "Pause",
  ACTIVATE: "Activate",
  OVER_BUDGET: "Over Budget",
  UNDER_BUDGET: "Under Budget",
  DUE_SOON: "⚠️ Due Soon!",
  OVERDUE_BILLS: "⚠️ Overdue Bills",
  UPCOMING_BILLS: "Upcoming Bills",
  NO_RECURRING_TRANSACTIONS: "No recurring transactions. Add your first recurring transaction!",
  NO_BILL_REMINDERS: "No bill reminders. Add your first bill reminder!",
  NO_BUDGETS: "No budgets set for this month. Create your first budget!",
  FILTER_BY_CATEGORY: "Filter by Category:",
  ALL_CATEGORIES: "All Categories",
  CLEAR_FILTER: "Clear Filter",
  SEARCH_PLACEHOLDER: "Search transactions, categories, amounts...",
  SEARCH_LABEL: "Search",
  CLEAR_SEARCH: "Clear",
  BANK_STATEMENT: "Bank Statement",
  TRANSACTION_S: "Transaction(s)",
  DEPOSITS: "Deposits",
  WITHDRAWALS: "Withdrawals",
  BALANCE: "Balance",
  ACTION: "ACTION",
  S_NO: "S.NO",
  DATE: "DATE",
  MODE: "MODE",
  PARTICULARS: "PARTICULARS",
  IMPORT_BANK_STATEMENT: "Import Bank Statement",
  IMPORT_TRANSACTIONS: "Import Transactions",
  IMPORT_TRANSACTIONS_SUBTITLE: "Upload your CSV bank statements to categorize and analyze wealth.",
  HIDE_IMPORT: "Hide Import",
  UPLOAD_CSV_EXCEL: "Upload a PDF or CSV bank statement — AI extracts and categorizes transactions",
  UPLOAD_DROP_HINT: "Drag and drop statement here",
  UPLOAD_BROWSE_HINT: "Or click to browse your computer (Max {maxMb}MB)",
  UPLOAD_ACCEPTED_FORMATS: "PDF or CSV (XLSX also supported)",
  IMPORT_PARSING: "Reading statement with AI…",
  IMPORT_PREVIEW_TITLE: "Import Preview",
  IMPORT_PREVIEW_SUBTITLE:
    "Deselect any rows you want to skip. Duplicates are flagged and unchecked by default — re-select them if you still want to import.",
  IMPORT_APPROVE: "Import selected",
  IMPORT_ITEMS: "Import {count} Items",
  IMPORT_SELECT_ALL: "Select all",
  IMPORT_DESELECT_ALL: "Deselect all",
  IMPORT_DISCARD_ALL: "Discard All",
  IMPORT_DUPLICATE_BADGE: "Duplicate",
  IMPORT_DUPLICATE_IN_ACCOUNT: "Already in account",
  IMPORT_DUPLICATE_IN_FILE: "Duplicate in this file",
  IMPORT_DUPLICATE_BANNER:
    "{count} possible duplicate(s) found — unchecked by default. Re-select any you still want to import ({selected} selected).",
  IMPORT_DUPLICATE_BANNER_NONE_SELECTED:
    "{count} possible duplicate(s) found — unchecked by default. Re-select any you still want to import.",
  IMPORT_FILE_FORMAT_GUIDE_TITLE: "How it works",
  IMPORT_SUCCESS_COUNT: "Successfully imported {count} transaction(s)!",
  IMPORT_SUCCESS_WITH_DUPLICATES:
    "Successfully imported {count} transaction(s), including {duplicates} previously flagged duplicate(s).",
  IMPORT_SUCCESS_WITH_SKIPPED: "Successfully imported {count} transaction(s). {skipped} duplicate(s) were skipped.",
  IMPORT_NONE_SELECTED: "Select at least one transaction to import.",
  IMPORT_SUPPORT: "Support",
  IMPORT_SUPPORT_TIP:
    "Upload a PDF/CSV bank statement. AI extracts rows, suggests categories, and flags duplicates before you import.",
  IMPORT_SAMPLE_CSV: "Sample CSV",
  IMPORT_STEP_UPLOAD: "Upload Statement",
  IMPORT_STEP_REVIEW: "Review & Map",
  IMPORT_STEP_FINISH: "Finish Import",
  IMPORT_AUTO_MAPPING: "Auto-mapping:",
  IMPORT_AUTO_MAPPING_ACTIVE: "Active",
  IMPORT_TRANSACTIONS_FOUND: "{count} Transactions Found",
  IMPORT_STATUS_VALID: "Valid",
  IMPORT_STATUS_REVIEW: "Review",
  IMPORT_STATUS_DUPLICATE: "Duplicate",
  IMPORT_SELECT_CATEGORY: "Select Category",
  IMPORT_MISSING_REFERENCE: "Missing reference data",
  IMPORT_AI_SUGGESTED: "AI has suggested categories for {pct}% of entries.",
  IMPORT_NEW_CATEGORIES_ADDED:
    "Added {count} new categories from this statement — they now appear when you add income or expense.",
  IMPORT_PRIVACY_TITLE: "Privacy Guaranteed",
  IMPORT_PRIVACY_BODY: "Statements are processed securely and never shared with other accounts.",
  IMPORT_AI_CAT_TITLE: "AI Categorization",
  IMPORT_AI_CAT_BODY: "Merchants are auto-mapped to categories you can edit before import.",
  IMPORT_SAFE_SYNC_TITLE: "Safe Syncing",
  IMPORT_SAFE_SYNC_BODY: "Likely duplicates are flagged and unchecked by default. Re-select any you still want to add.",
  IMPORT_EXT_CSV: ".CSV",
  IMPORT_EXT_XLSX: ".XLSX",
  IMPORT_EXT_PDF: ".PDF",
  DESCRIPTION: "Description",
  AMOUNT: "Amount",
  STATUS: "Status",
  SAMPLE_CSV_PATH: "/samples/sample-hdfc.csv",
  SAMPLE_CSV_FILENAME: "sample-hdfc.csv",
  CATEGORY_EDITED: "Category edited",
  TOTAL_GOALS: "Total Goals",
  TOTAL_TARGET: "Total Target",
  TOTAL_SAVED: "Total Saved",
  AVERAGE_MONTHLY_EXPENSE: "Average Monthly Expense",
  PROJECTED_ANNUAL_EXPENSE: "Projected Annual Expense",
  TREND: "Trend",
  TOTAL_INCOME_LABEL: "Total Income",
  TOTAL_EXPENSES_LABEL: "Total Expenses",
  NET_BALANCE: "Net Balance",
  SAVINGS_RATE: "Savings Rate",
  RECENT_TRANSACTIONS: "Recent Transactions",
  DASHBOARD: "Dashboard",
  HOME: "Home",
  TRANSACTION: "Transaction",
  ANALYTICS: "Analytics",
  ANALYTICS_AND_REPORTS: "Analytics & Reports",
  SEARCH_ANALYTICS: "Search analytics…",
  OVERVIEW: "Overview",
  REPORTS_TAB: "Reports",
  CURRENT_BALANCE: "Current Balance",
  CURRENT_BALANCE_HINT: "All-time income minus expenses",
  AVERAGE_DAILY_SPEND: "Avg Daily Spend",
  SPEND_VS_INCOME: "Spend vs Income",
  OF_INCOME: "of income",
  LARGEST_TRANSACTIONS: "Largest Transactions",
  PERIOD_BALANCE: "Period Balance",
  MONTHLY_SPEND: "Monthly Spend",
  BUDGET_HEALTH: "Budget Health",
  FORECAST_EOY: "Forecast (EOY)",

  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  WATCH: "Watch",
  VS_LAST_MONTH: "vs. last month",
  FORECAST_PACE_HINT: "Projection based on current monthly pace",
  BUDGET_VS_ACTUAL_SUBTITLE: "Monthly comparison across top categories",
  EXPENSE_FORECAST_SUBTITLE: "Anticipated spending based on historical data",
  CATEGORY_DISTRIBUTION: "Category Distribution",
  CRITICAL_ALERTS: "Critical Alerts",
  BUDGET_EXCEEDED: "Budget Exceeded",
  GOAL_REACHED: "Goal Reached",
  NEARING_LIMIT: "Nearing Limit",
  NO_CRITICAL_ALERTS: "No critical alerts right now",
  VIEW_ALL_NOTIFICATIONS: "View All Notifications",
  EXPORT_PDF: "Export",
  ACTUAL_SPENT: "Actual Spent",
  INSIGHT: "Insight",
  CURRENT_LABEL: "Current",
  TOTAL_LABEL: "Total",
  PROFILE: "Profile",
  TRANSFER: "Transfer",
  ALL: "All",
  OUTCOME: "Outcome",
  BUDGET: "Budget",
  TOTAL_BALANCE: "Total Balance",
  AVAILABLE_BALANCE: "Available Balance",
  THIS_PERIOD: "This Period",
  TOTAL_SPEND: "Total Spend",
  MONTHLY_INCOME: "Monthly Income",
  MONTHLY_EXPENSE: "Monthly Expense",
  MONTHLY_BUDGET: "Monthly Budget",
  VIEW_ALL: "View All",
  STATUS_COMPLETED: "COMPLETED",
  STATUS_PENDING: "PENDING",
  JUST_NOW: "Just now",
  MINUTES_AGO: "minutes ago",
  MINUTE_AGO: "minute ago",
  HOURS_AGO: "hours ago",
  HOUR_AGO: "hour ago",
  DAYS_AGO: "days ago",
  DAY_AGO: "day ago",
  REFRESH: "Refresh",
  EXPORT_DATA: "Export",
  MORE_OPTIONS: "More options",
  MAIN_ACCOUNT: "Main Account",
  YOUVE_SPENT: "You've Spent",
  BUDGET_ITEM: "Budget Item",
  BUDGET_ALERT: "Budget Alert",
  INCOME_ANALYTICS: "Income Analytics",
  ACCOUNT_SETTING: "Account Setting",
  APP_SETTING: "App Setting",
  EDIT_PROFILE: "Edit Profile",
  SECURITY_PRIVACY: "Security & Privacy",
  NOTIFICATIONS: "Notifications",
  APPEARANCE: "Appearance",
  THEME_LIGHT: "Light",
  THEME_DARK: "Dark",
  THEME_SYSTEM: "System",
  TOGGLE_THEME: "Toggle theme",
  CURRENCY_LANGUAGE: "Currency & Language",
  SORT: "Sort",
  SORT_BY_COLUMN: "Sort by {column}",
  OF: "of",
  DAYS_LEFT: "days left",
  /** Label used in bill rows (includes trailing colon). */
  DUE: "Due:",
  OTHERS: "Others",
  BILLS: "Bills",
  BILLS_AND_RECURRING: "Bills & Recurring",
  GOALS: "Goals",
  ALL_TIME: "All Time",
  PREVIOUS_MONTH: "Previous month",
  NEXT_MONTH: "Next month",
  PREVIOUS_YEAR: "Previous year",
  NEXT_YEAR: "Next year",
  PAYMENTS_CALENDAR: "Payments Calendar",
  CALENDAR_VIEW: "Calendar View",
  TOTAL_PAYMENTS: "Total Payments",
  OVERDUE: "Overdue",
  UPCOMING: "Upcoming",
  TOTAL_MONTHLY: "Total Monthly",
  TOTAL_DUE_7_DAYS: "Total Due (7 Days)",
  TOTAL_DUE_THIS_MONTH: "Total Due this Month",
  BILLS_TIMELINE: "Bills Timeline",
  PAY_NOW: "Pay Now",
  PAY_SELECTED: "Pay Selected",
  PAY_ALL: "Pay All",
  STATUS_OVERDUE: "Overdue",
  STATUS_UPCOMING: "Upcoming",
  STATUS_AUTO_PAY: "Auto-Pay",
  STATUS_PAID: "Paid",
  DUE_TODAY: "Due today",
  DUE_IN_DAYS: "Due in {n} days",
  DUE_DAYS_AGO: "Due {n} days ago",
  DUE_IN_ONE_DAY: "Due in 1 day",
  DUE_ONE_DAY_AGO: "Due 1 day ago",
  SEARCH_BILLS: "Search bills…",
  NO_BILLS_MATCH: "No bills match this filter",
  SUCCESS_BILLS_MARKED_PAID: "{n} bills marked as paid",
  NO_UNPAID_BILLS: "No unpaid bills to pay",
  SHOW_CALENDAR: "Show calendar",
  HIDE_CALENDAR: "Hide calendar",
  RECURRING: "Recurring",
  PAYMENTS_FOR: "Payments for",
  NO_PAYMENTS_FOR: "No payments for",
  ADD_BILLS_TO_CALENDAR: "Add bill reminders or recurring transactions to see them on the calendar",
  RECURRING_PAYMENT: "Recurring Payment",
  PAID: "Paid",
  DAYS_OVERDUE: "days overdue",
  TODAY: "Today",
  CLOSE: "Close",
  OPENING_BALANCE: "Opening Balance",
  BALANCE_BROUGHT_FORWARD: "Balance brought forward",
  VIEW_AND_MANAGE_TRANSACTIONS: "View and manage your income and expenses",
  VIEW_CONTROLS_TITLE: "View Controls",
  VIEW_CONTROLS_SUBTITLE_TRANSACTIONS: "Filter transactions by period",
  VIEW_CONTROLS_SUBTITLE_BUDGETS: "Filter budgets by period",
  VIEW_CONTROLS_SUBTITLE_BILLS: "Filter bills by period",
  VIEW_CONTROLS_SUBTITLE_REPORTS: "Filter reports by period",
  VIEW_TYPE_LABEL: "View Type",
  VIEW_PERIOD_LABEL: "View Period",
  NOT_AVAILABLE: "N/A",
  NO_DESCRIPTION: "No description",
  BILL_NAME: "Bill Name",
  DUE_DATE: "Due Date",
  START_DATE: "Start Date",
  END_DATE_OPTIONAL: "End Date (Optional)",
  RECURRING_BILL: "Recurring Bill",
  REMIND_ME_DAYS_BEFORE: "Remind Me (days before)",
  PLEASE_FILL_ALL_FIELDS: "Please fill in all required fields.",
  AMOUNT_MUST_BE_GREATER_THAN_ZERO: "Amount must be greater than 0.",
  DUPLICATE_TRANSACTION:
    "This transaction already exists. A duplicate transaction with the same date, description, amount, and type was found.",
  BILL_AMOUNT_MUST_BE_GREATER_THAN_ZERO: "Bill amount must be greater than 0.",
  FILTERED: "Filtered",
  LOADING: "Loading...",
  TRY_AGAIN: "Try again",
  SUCCESS_TRANSACTION_ADDED: "Transaction added successfully!",
  SUCCESS_TRANSACTION_UPDATED: "Transaction updated successfully!",
  SUCCESS_TRANSACTION_DELETED: "Transaction deleted successfully",
  SUCCESS_BUDGET_ADDED: "Budget added successfully!",
  SUCCESS_BUDGET_UPDATED: "Budget updated successfully!",
  SUCCESS_BUDGET_DELETED: "Budget deleted successfully",
  SUCCESS_BILL_ADDED: "Bill reminder added successfully!",
  SUCCESS_BILL_UPDATED: "Bill reminder updated successfully!",
  SUCCESS_BILL_DELETED: "Bill reminder deleted successfully",
  SUCCESS_BILL_MARKED_PAID: "Bill marked as paid",
  SUCCESS_BILL_MARKED_PAID_TOAST: "Bill marked as paid!",
  SUCCESS_RECURRING_ADDED: "Recurring transaction added successfully!",
  SUCCESS_RECURRING_UPDATED: "Recurring transaction updated successfully!",
  SUCCESS_RECURRING_DELETED: "Recurring transaction deleted successfully",
  SUCCESS_RECURRING_ACTIVATED: "Recurring transaction activated successfully!",
  SUCCESS_RECURRING_PAUSED: "Recurring transaction paused successfully!",
  SUCCESS_GOAL_ADDED: "Savings goal added successfully!",
  SUCCESS_GOAL_DELETED: "Savings goal deleted successfully",
  SUCCESS_EXPORT: "Data exported successfully as {filename}",
};

// User-facing error messages (for API, loading, import/export)
export const ERROR_MESSAGES = {
  REQUEST_FAILED: "Request failed",
  LOAD_DATA_FAILED: "Could not refresh data from the server. Showing your last loaded data.",
  SAVE_FAILED: "Failed to save",
  SERVER_ERROR: "An error occurred. Please try again.",
  DB_NOT_CONFIGURED: "Database not configured",
  BOUNDARY_FALLBACK: "Something went wrong. Please refresh the page.",
  CSV_READ_FAILED: "Failed to read CSV file. Please try again.",
  PDF_NO_VALID_TRANSACTIONS: "No valid transactions found in the PDF file",
  EXCEL_READ_FAILED: "Failed to read Excel file. Please try again.",
  EXCEL_LEGACY_XLS_UNSUPPORTED:
    "Legacy .xls files are not supported. Please save the file as .xlsx or export as CSV and try again.",
  EXCEL_FIRST_SHEET: "Could not read the first sheet from Excel file.",
  NO_DATA_TO_EXPORT: "No data to export",
  NO_TRANSACTIONS_TO_EXPORT: "No transactions to export",
  CSV_EMPTY:
    "CSV file appears to be empty or invalid. Please ensure the file contains at least a header row and one data row.",
  CSV_NO_HEADERS: "CSV file has no valid headers. Please ensure the first row contains column names.",
  CSV_MISSING_COLUMNS:
    "CSV file format doesn't match expected format. Missing required columns: {missing}. Found columns: {found}. Please ensure your CSV file has columns for Date, Description/Particulars, and Amount/Deposits/Withdrawals.",
  CSV_NO_TRANSACTIONS:
    "No valid transactions found in the CSV file. Please ensure the file contains transaction data with Date, Description, and Amount columns.",
  CSV_PARSE_ERROR:
    "Error parsing CSV file: {message}. Please ensure it's a valid CSV file with proper column headers (Date, Mode, Particulars, Deposits, Withdrawals, Balance).",
  PDF_PARSE_ERROR: "Error parsing PDF file: {message}. Please ensure it's a valid PDF file with readable text.",
  EXCEL_PARSE_ERROR:
    "Failed to parse Excel file: {message}. Please ensure the file is a valid Excel file (.xlsx format).",
  EXCEL_NO_SHEETS: "Excel file has no sheets. Please ensure the file contains data.",
  EXCEL_CONVERT_ERROR: "Failed to convert Excel data: {message}. Please check the file format.",
  EXCEL_EMPTY:
    "Excel file appears to be empty or has no data rows. Please ensure the file contains at least a header row and one data row.",
  EXCEL_NO_HEADERS: "Excel file has no valid headers. Please ensure the first row contains column names.",
  EXCEL_MISSING_COLUMNS:
    "Excel file format doesn't match expected format. Missing required columns: {missing}. Found columns: {found}. Please ensure your Excel file has columns for Date, Description, and Amount.",
  EXCEL_NO_TRANSACTIONS:
    "No valid transactions found in the Excel file. Please ensure the file contains transaction data with Date, Description, and Amount columns.",
  EXCEL_PARSE_ERROR_FALLBACK:
    "Error parsing Excel file: {message}. Please ensure it's a valid Excel file (.xlsx format) with proper column headers.",
  IMPORT_NONE_SKIPPED:
    "No transactions were imported. {skipped} transaction(s) were skipped. Reasons: {reasons}. Please check the file format and ensure dates, amounts, and required fields are present.",
  STATEMENT_UNSUPPORTED_TYPE: "Unsupported file type. Please upload a PDF, CSV, or XLSX bank statement.",
  STATEMENT_FILE_TOO_LARGE: "File is too large. Maximum size is {maxMb} MB.",
  STATEMENT_EMPTY_TEXT: "Could not read any text from the uploaded file.",
  STATEMENT_NO_TRANSACTIONS: "No transactions were found in this statement. Try a clearer PDF/CSV export.",
  AI_API_KEY_MISSING:
    "AI parsing is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY), or OPENAI_API_KEY as fallback, in the server environment.",
  AI_PARSE_FAILED: "AI could not parse this statement: {message}",
  AI_PARSE_INVALID_JSON: "AI returned an unexpected response. Please try again.",
  AI_PARSE_EMPTY_RESPONSE: "AI returned an empty response. Please try again.",
  AI_SUGGEST_CATEGORY_FAILED: "AI could not suggest a category: {message}",
  AI_SUGGEST_CATEGORY_INVALID: "AI returned an invalid category suggestion.",
  PARSE_STATEMENT_FAILED: "Failed to parse bank statement. Please try again.",
  SUGGEST_CATEGORY_TITLE_REQUIRED: "A transaction title is required to suggest a category.",
};

/**
 * Bank statement AI import limits & models.
 * Server prefers Gemini (GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY),
 * then falls back to OpenAI (OPENAI_API_KEY). Keys are server-only.
 */
export const STATEMENT_IMPORT = {
  // gemini-2.5-flash is blocked for many new API keys; use current Flash.
  GEMINI_MODEL: "gemini-3.6-flash",
  OPENAI_MODEL: "gpt-4o-mini",
  MAX_FILE_BYTES: 10 * 1024 * 1024,
  MAX_TEXT_CHARS: 100_000,
  ACCEPTED_EXTENSIONS: [".pdf", ".csv", ".xlsx"],
  ACCEPTED_MIME: [
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  FIELD_NAME: "file",
};

/** Review-table column sort keys (Import Preview). */
export const IMPORT_PREVIEW_SORT_KEYS = {
  DATE: "date",
  DESCRIPTION: "description",
  CATEGORY: "category",
  AMOUNT: "amount",
  STATUS: "status",
} as const;

export const SORT_DIRECTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const IMPORT_PREVIEW_SORT = {
  DEFAULT_KEY: IMPORT_PREVIEW_SORT_KEYS.DATE,
  DEFAULT_DIRECTION: SORT_DIRECTIONS.DESC,
} as const;

// Recurrence Types
export const RECURRENCE_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

// Recurrence Labels
export const RECURRENCE_LABELS = {
  [RECURRENCE_TYPES.DAILY]: "Daily",
  [RECURRENCE_TYPES.WEEKLY]: "Weekly",
  [RECURRENCE_TYPES.MONTHLY]: "Monthly",
  [RECURRENCE_TYPES.YEARLY]: "Yearly",
};

// Default State
export const DEFAULT_STATE = {
  transactions: [],
  savingsGoals: [],
  budgets: [],
  recurringTransactions: [],
  billReminders: [],
  categories: { income: [], expense: [] },
  viewPeriod: VIEW_PERIODS.MONTHLY,
  viewType: VIEW_TYPES.LIST,
  selectedMonth: undefined,
  selectedYear: undefined,
  selectedCategory: "",
  searchQuery: "",
};

/** Shared Modal shell timing / stacking (CSS animations in globals.css). */
export const MODAL = {
  BASE_Z: 1100,
  Z_STEP: 10,
  ENTER_MS: 240,
  EXIT_MS: 200,
} as const;

// App branding (Stitch project 9083140746767418409)
export const APP_NAME = "Budgety";
export const APP_LOGO_SRC = "/budget.png";
export const APP_LOGO_ALT = "Budgety";
export const APP_ICON_192_SRC = "/icon-192.png";
export const APP_ICON_512_SRC = "/icon-512.png";
export const APP_APPLE_TOUCH_ICON_SRC = "/apple-touch-icon.png";
export const APP_FAVICON_SRC = "/favicon-32.png";
export const APP_OG_IMAGE_SRC = "/og-image.png";

/** Stitch light design tokens from screen HTML exports */
export const STITCH_COLORS = {
  PRIMARY: "#4343D5",
  PRIMARY_CONTAINER: "#5D5FEF",
  PRIMARY_DARK: "#2E2BC2",
  PRIMARY_MUTED: "#C1C1FF",
  PRIMARY_SOFT: "#E2E7FF",
  BACKGROUND: "#FAF8FF",
  SURFACE_LOW: "#F2F3FF",
  SURFACE_CONTAINER: "#EAEDFF",
  ON_SURFACE: "#131B2E",
  OUTLINE: "#767586",
  INCOME: "#008259",
  EXPENSE: "#FF4D4D",
  TERTIARY: "#006645",
  BALANCE_FROM: "#1A2B88",
  BALANCE_TO: "#5B4BDB",
  FAB: "#5D5FEF",
};

/** Stitch Obsidian Flux surfaces + Budgety purple brand (dark mode). */
export const STITCH_DARK_COLORS = {
  PRIMARY: "#C1C1FF",
  PRIMARY_CONTAINER: "#5D5FEF",
  PRIMARY_DARK: "#A8A7FF",
  PRIMARY_MUTED: "#5B5A9A",
  PRIMARY_SOFT: "#2A2A4A",
  BACKGROUND: "#131314",
  SURFACE: "#131314",
  SURFACE_LOW: "#1C1B1C",
  SURFACE_CONTAINER: "#201F20",
  SURFACE_HIGH: "#2A2A2B",
  SURFACE_HIGHEST: "#353436",
  ON_SURFACE: "#E5E2E3",
  ON_SURFACE_VARIANT: "#C4D0D1",
  OUTLINE: "#849495",
  OUTLINE_VARIANT: "#3B494B",
  CARD: "#1F1E1F",
  INCOME: "#27FF97",
  EXPENSE: "#FFB4AB",
  TERTIARY: "#00E383",
  BALANCE_FROM: "#1A2B88",
  BALANCE_TO: "#5B4BDB",
  FAB: "#5D5FEF",
};

/** Category colors for spend bars / donuts (Stitch multi-color palette). */
export const STITCH_CHART_COLORS = [
  "#4A6CFF",
  "#22C55E",
  "#FBBF24",
  "#F97316",
  "#06B6D4",
  "#9CA3AF",
  "#EC4899",
  "#8B5CF6",
];

// Currency Symbol
export const CURRENCY_SYMBOL = "₹";

// Date formats: accept/store ISO string (e.g. 2018-04-04T16:00:00.000Z); display short/long
export const DATE_FORMAT = "DD-MM-YYYY";
/** Long display: DD-MMM-YYYY HH:MM AM/PM */
export const DATE_FORMAT_LONG = "DD-MMM-YYYY hh:mm A";
/** Short month + day for list rows (e.g. Oct 12) */
export const DATE_FORMAT_MONTH_DAY = "MMM D";
/** ISO 8601 date-only for DB DATE columns (YYYY-MM-DD) */
export const DATE_FORMAT_STORAGE = "YYYY-MM-DD";

// Months
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: [
    "#4A6CFF",
    "#22C55E",
    "#FBBF24",
    "#F97316",
    "#06B6D4",
    "#9CA3AF",
    "#EC4899",
    "#8B5CF6",
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
  ],
  HEIGHT: 300,
  MARGIN: { top: 20, right: 30, left: 20, bottom: 20 },
  PIE_OUTER_RADIUS: 100,
  PIE_INNER_RADIUS: 70,
  DEFAULT_CHART_HEIGHT: 300,
};

// Dialog/UI Colors
export const DIALOG_COLORS = {
  ERROR: "#ef4444",
  INFO: "#3b82f6",
  WARNING: "#eab308",
  SUCCESS: "#10b981",
};

// Dialog Configuration
export const DIALOG_CONFIG = {
  ICON_SIZE: "2.5rem",
  ICON_MARGIN_BOTTOM: "0.5rem",
  MIN_BUTTON_WIDTH: "100px",
  /** Class for FormFieldGroup inside dialogs (consistent top/bottom spacing) */
  FORM_GROUP_CLASS: "my-4",
};

// Display Limits
export const DISPLAY_LIMITS = {
  TOP_CATEGORIES: 8,
  PREVIEW_ITEMS: 5,
  PREVIEW_ROWS: 50,
  TOP_CATEGORIES_ANALYSIS: 10,
  LARGEST_TRANSACTIONS: 5,
  UPCOMING_BILLS: 10,
  TREND_MONTHS: 6,
  FORECAST_MONTHS: 3,
  SAMPLE_ROWS: 3,
  DESCRIPTION_LENGTH: 45,
};

// Timeout Values (in milliseconds)
export const TIMEOUTS = {
  TOAST_SUCCESS: 3000,
  TOAST_ERROR: 5000,
  TOAST_WARNING: 4000,
  TOAST_INFO: 3000,
  TOAST_DETAILS: 8000,
  IMPORT_SUCCESS: 5000,
};

// Percentage Thresholds
export const PERCENTAGE_THRESHOLDS = {
  MAX: 100,
  WARNING: 80,
  MIN: 0,
};

// Date/Time Constants
export const DATE_CONSTANTS = {
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
  MONTHS_PER_YEAR: 12,
  DEFAULT_REMINDER_DAYS: 3,
  MAX_REMINDER_DAYS: 30,
  /** Window used by Bills sticky summary / Pay Selected. */
  BILLS_DUE_WINDOW_DAYS: 7,
};

// Number Formatting
export const NUMBER_FORMAT = {
  DECIMAL_PLACES: 2,
  STEP_VALUE: 0.01,
  MIN_YEAR: 2020,
  MAX_YEAR: 2100,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
};

// Currency Formatting Options
export const CURRENCY_FORMAT_OPTIONS = {
  STANDARD: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

// Currency Formatting Thresholds
export const CURRENCY_THRESHOLDS = {
  MILLION: 1000000,
  THOUSAND: 1000,
};

// Default Values
export const DEFAULT_VALUES = {
  AMOUNT: 0,
  BALANCE: 0,
  DATE_TIMESTAMP: 0,
  EMPTY_STRING: "",
};

/**
 * Hard-mapped personal UPI payees → expense categories.
 * Matchers are case-insensitive substrings; keep Naim vs Sameer distinct
 * (never match on "MOHAMMAD" alone).
 */
export const KNOWN_UPI_PAYEE_OVERRIDES = [
  {
    label: "Mohammad Naim",
    category: EXPENSE_CATEGORIES.GROCERIES,
    matchers: ["mohammad.naim1", "mohammad naim", "mohammad n/", "naim"],
  },
  {
    label: "Mohammad Sameer",
    category: EXPENSE_CATEGORIES.HOME_EXPENSE,
    matchers: [
      "9013411448@axl",
      "mohammad sameer",
      "mohammad s/",
      "sameer",
    ],
  },
] as const;

// Category Detection Patterns
export const CATEGORY_PATTERNS = {
  INCOME: {
    [INCOME_CATEGORIES.SALARY]: ["salary", "payroll", "wage", "pay", "compensation", "income"],
    [INCOME_CATEGORIES.FREELANCE]: ["freelance", "consulting", "contract", "gig", "project"],
    [INCOME_CATEGORIES.INVESTMENT]: [
      "investment",
      "dividend",
      "interest",
      "return",
      "profit",
      "capital gain",
      "ppf",
      "public provident fund",
      "provident fund",
      "trf frm sb",
      "trf from sb",
      "transfer from sb",
      "transfer from savings",
    ],
    [INCOME_CATEGORIES.RENTAL]: ["rent", "rental", "lease", "property income"],
    [INCOME_CATEGORIES.BONUS]: ["bonus", "incentive", "reward", "commission"],
    [INCOME_CATEGORIES.BUSINESS]: ["business", "sale", "revenue", "income from business"],
  },
  EXPENSE: {
    [EXPENSE_CATEGORIES.GROCERIES]: ["grocery", "supermarket", "food", "vegetable", "mart", "store", "provision"],
    [EXPENSE_CATEGORIES.HOUSING]: ["rent", "housing", "mortgage", "emi", "home loan", "maintenance"],
    [EXPENSE_CATEGORIES.TRANSPORTATION]: [
      "fuel",
      "petrol",
      "diesel",
      "uber",
      "ola",
      "taxi",
      "transport",
      "metro",
      "bus",
      "train",
      "flight",
      "travel",
    ],
    [EXPENSE_CATEGORIES.DINING]: ["restaurant", "dining", "cafe", "food delivery", "zomato", "swiggy", "hotel"],
    [EXPENSE_CATEGORIES.UTILITIES]: [
      "electricity",
      "water",
      "gas",
      "utility",
      "bill",
      "phone",
      "mobile",
      "internet",
      "broadband",
    ],
    [EXPENSE_CATEGORIES.HEALTHCARE]: ["medical", "hospital", "pharmacy", "health", "doctor", "medicine", "clinic"],
    [EXPENSE_CATEGORIES.EDUCATION]: ["education", "school", "tuition", "college", "course", "fee"],
    [EXPENSE_CATEGORIES.SHOPPING]: ["shopping", "mall", "store", "amazon", "flipkart", "purchase", "buy"],
    [EXPENSE_CATEGORIES.ENTERTAINMENT]: ["entertainment", "movie", "netflix", "streaming", "spotify", "game", "cinema"],
    [EXPENSE_CATEGORIES.INSURANCE]: ["insurance", "premium", "policy"],
    [EXPENSE_CATEGORIES.SUBSCRIPTIONS]: ["subscription", "membership", "recurring", "auto-debit"],
    [EXPENSE_CATEGORIES.TRAVEL]: ["travel", "vacation", "trip", "hotel booking", "booking"],
    [EXPENSE_CATEGORIES.PERSONAL_CARE]: ["salon", "spa", "beauty", "gym", "fitness"],
    [EXPENSE_CATEGORIES.GIFTS]: ["gift", "donation", "charity"],
    [EXPENSE_CATEGORIES.BONDS]: ["bonds", "bond", "government bond", "corporate bond"],
    [EXPENSE_CATEGORIES.ELSS]: ["elss", "equity linked savings scheme", "tax saving mutual fund"],
    [EXPENSE_CATEGORIES.ETF]: ["etf", "exchange traded fund", "index fund"],
    [EXPENSE_CATEGORIES.INVESTMENTS]: [
      "investment",
      "invest",
      "portfolio",
      "asset",
      "capital",
      "ppf",
      "public provident fund",
      "provident fund",
      "trf frm sb",
      "trf from sb",
      "transfer from sb",
      "transfer from savings",
    ],
    [EXPENSE_CATEGORIES.LOAN_PAYMENTS]: [
      "loan",
      "emi",
      "loan payment",
      "installment",
      "repayment",
      "personal loan",
      "car loan",
      "education loan",
      "ach/bd",
      "bankloan",
      "bank loan",
      "tatacapitalhousingfi",
      "tata capital housing",
    ],
    [EXPENSE_CATEGORIES.MISC_EXPENSES]: ["misc", "miscellaneous", "other expense", "various"],
    [EXPENSE_CATEGORIES.MUTUAL_FUNDS]: ["mutual fund", "mf", "sip", "equity fund", "debt fund", "hybrid fund"],
    [EXPENSE_CATEGORIES.NPS]: ["nps", "national pension scheme", "pension"],
    [EXPENSE_CATEGORIES.PPF]: [
      "ppf",
      "public provident fund",
      "provident fund",
      "trf frm sb",
      "trf from sb",
      "transfer from sb",
      "transfer from savings",
    ],
    [EXPENSE_CATEGORIES.REIT]: ["reit", "real estate investment trust"],
    [EXPENSE_CATEGORIES.SIP]: ["sip", "systematic investment plan", "mutual fund sip"],
    [EXPENSE_CATEGORIES.CREDIT_CARD]: [
      "credit card",
      "cred",
      "paidviacred",
      "dreampurse",
      "mmt/imps",
      "paid via cred",
      "wallet to card",
      "american e",
      "amercian e",
      "standardc",
      "american express",
      "standard chartered",
      "amexcard",
      "amex card pay",
      "amex card",
      "bil/onl",
    ],
  },
  INVESTMENTS: {
    [INVESTMENT_CATEGORIES.STOCKS]: ["stock", "stocks", "equity", "equities"],
  },
  [INVESTMENT_CATEGORIES.BONDS]: ["bond", "bonds", "government bond", "corporate bond"],
  [INVESTMENT_CATEGORIES.MUTUAL_FUNDS]: ["mutual fund", "mf", "sip", "equity fund", "debt fund", "hybrid fund"],
  [INVESTMENT_CATEGORIES.ETF]: ["etf", "exchange traded fund", "index fund"],
  [INVESTMENT_CATEGORIES.REITS]: ["reit", "real estate investment trust"],
  [INVESTMENT_CATEGORIES.P2P]: ["p2p", "peer to peer lending", "peer to peer"],
  [INVESTMENT_CATEGORIES.CRYPTO]: [
    "crypto",
    "bitcoin",
    "ethereum",
    "ripple",
    "litecoin",
    "bitcoin cash",
    "ethereum classic",
    "litecoin",
    "bitcoin cash",
    "ethereum classic",
  ],
  [INVESTMENT_CATEGORIES.PPF]: [
    "ppf",
    "public provident fund",
    "provident fund",
    "trf frm sb",
    "trf from sb",
    "transfer from sb",
    "transfer from savings",
  ],
};

// Bank Statement Column Mapping Patterns
export const COLUMN_MAPPING_PATTERNS = {
  SERIAL: ["serial", "s.no", "sr no", "sno", "sl no", "sl. no", "sr.", "no.", "number"],
  DATE: ["date", "transaction date", "txn date", "value date", "posting date", "transaction_date", "txn_date"],
  MODE: ["mode", "transaction mode", "payment mode", "payment_method", "transaction_mode", "method"],
  DESCRIPTION: [
    "description",
    "narration",
    "details",
    "particular",
    "particulars",
    "remark",
    "transaction remark",
    "transaction_remark",
    "narration/particulars",
    "transaction details",
    "particulars", // Explicitly added for better matching
  ],
  DEPOSITS: ["deposit", "deposits", "credit", "cr", "credit amount", "deposit amount", "amount (cr)", "amount(cr)"],
  WITHDRAW: [
    "withdraw",
    "withdrawal",
    "withdrawals",
    "debit",
    "dr",
    "debit amount",
    "withdrawal amount",
    "amount (dr)",
    "amount(dr)",
  ],
  AMOUNT: ["amount", "transaction amount", "amount(inr)", "amount (inr)", "amount(inr)", "transaction_amount"],
  BALANCE: ["balance", "closing balance", "running balance", "available balance", "balance amount"],
  TYPE: ["type", "debit/credit", "dr/cr", "cr/dr", "transaction type", "credit/debit"],
};
