// Action Types
export const ACTION_TYPES = {
  ADD_TRANSACTION: "ADD_TRANSACTION",
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
};

// Transaction Types
export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
};

// Transaction Type Labels
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.INCOME]: "Income",
  [TRANSACTION_TYPES.EXPENSE]: "Expense",
};

// Transaction Modes (Payment Methods)
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
};

// Sorted expense categories array for dropdowns (alphabetically sorted)
export const SORTED_EXPENSE_CATEGORIES =
  Object.values(EXPENSE_CATEGORIES).sort();

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
  [EXPENSE_CATEGORIES.HOUSING]: "#e74c3c",
  [EXPENSE_CATEGORIES.INSURANCE]: "#607d8b",
  [EXPENSE_CATEGORIES.INVESTMENTS]: "#3498db",
  [EXPENSE_CATEGORIES.LOAN_PAYMENTS]: "#c0392b",
  [EXPENSE_CATEGORIES.MISC_EXPENSES]: "#95a5a6",
  [EXPENSE_CATEGORIES.MUTUAL_FUNDS]: "#2980b9",
  [EXPENSE_CATEGORIES.NPS]: "#1abc9c",
  [EXPENSE_CATEGORIES.OTHER]: "#ff5049",
  [EXPENSE_CATEGORIES.PERSONAL_CARE]: "#ff9800",
  [EXPENSE_CATEGORIES.PPF]: "#16a085",
  [EXPENSE_CATEGORIES.REIT]: "#27ae60",
  [EXPENSE_CATEGORIES.SHOPPING]: "#ff5722",
  [EXPENSE_CATEGORIES.SIP]: "#2980b9",
  [EXPENSE_CATEGORIES.SUBSCRIPTIONS]: "#795548",
  [EXPENSE_CATEGORIES.TRANSPORTATION]: "#3498db",
  [EXPENSE_CATEGORIES.TRAVEL]: "#00bcd4",
  [EXPENSE_CATEGORIES.UTILITIES]: "#1abc9c",
};

// View Periods
export const VIEW_PERIODS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  ALL: "all",
};

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
};

// View Type Labels
export const VIEW_TYPE_LABELS = {
  [VIEW_TYPES.LIST]: "List View",
  [VIEW_TYPES.CALENDAR]: "Calendar View",
};

// CSS Classes
export const CSS_CLASSES = {
  INCOME_TOTAL: "income-total",
  EXP_TOTAL: "exp-total",
  ADD_DESCRIPTION: "add__description",
  ADD_VALUE: "add__value",
  ADD_BTN: "add__btn",
  DEL_BTN: "del__btn",
  CARD: "card",
  CARD_HEADER: "card-header",
  CARD_BODY: "card-body",
  BTN_PRIMARY: "btn btn-primary",
  BTN_DANGER: "btn btn-danger",
  BTN_SUCCESS: "btn btn-success",
  BTN_SECONDARY: "btn btn-secondary",
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
  RECURRING_TRANSACTIONS: "Recurring Transactions",
  ADD_RECURRING: "Add Recurring Transaction",
  BILL_REMINDERS: "Bill Reminders",
  ADD_BILL: "Add Bill Reminder",
  MARK_AS_PAID: "Mark as Paid",
  BUDGETS: "Budgets",
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
  COMPREHENSIVE_FINANCIAL_ANALYSIS:
    "Comprehensive financial analysis and insights",
  NO_SPENDING_DATA: "No spending data available",
  NO_DATA_AVAILABLE: "No data available",
  CATEGORY_BREAKDOWN: "Category Breakdown",
  MONTHLY_TREND: "Monthly Trend",
  CONFIRM_DELETE_TRANSACTION:
    "Are you sure you want to delete this transaction?",
  CONFIRM_DELETE_GOAL: "Are you sure you want to delete this savings goal?",
  CONFIRM_DELETE_RECURRING:
    "Are you sure you want to delete this recurring transaction?",
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
  CONFIRM_CLEANUP_IMPORTED:
    "Are you sure you want to delete all imported transactions? This action cannot be undone.",
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
  NO_RECURRING_TRANSACTIONS:
    "No recurring transactions. Add your first recurring transaction!",
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
  UPLOAD_CSV_EXCEL: "Upload CSV, Excel, or PDF file to import transactions",
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
  BILLS: "Bills",
  GOALS: "Goals",
  ALL_TIME: "All Time",
  PAYMENTS_CALENDAR: "Payments Calendar",
  CALENDAR_VIEW: "Calendar View",
  TOTAL_PAYMENTS: "Total Payments",
  OVERDUE: "Overdue",
  RECURRING: "Recurring",
  PAYMENTS_FOR: "Payments for",
  NO_PAYMENTS_FOR: "No payments for",
  ADD_BILLS_TO_CALENDAR:
    "Add bill reminders or recurring transactions to see them on the calendar",
  RECURRING_PAYMENT: "Recurring Payment",
  PAID: "Paid",
  DAYS_OVERDUE: "days overdue",
  DAYS_LEFT: "days left",
  DUE: "Due:",
  TODAY: "Today",
  CLOSE: "Close",
  OPENING_BALANCE: "Opening Balance",
  BALANCE_BROUGHT_FORWARD: "Balance brought forward",
  VIEW_AND_MANAGE_TRANSACTIONS: "View and manage your income and expenses",
  NOT_AVAILABLE: "N/A",
  BILL_NAME: "Bill Name",
  DUE_DATE: "Due Date",
  START_DATE: "Start Date",
  END_DATE_OPTIONAL: "End Date (Optional)",
  RECURRING_BILL: "Recurring Bill",
  REMIND_ME_DAYS_BEFORE: "Remind Me (days before)",
  PLEASE_FILL_ALL_FIELDS: "Please fill in all required fields.",
  AMOUNT_MUST_BE_GREATER_THAN_ZERO: "Amount must be greater than 0.",
  BILL_AMOUNT_MUST_BE_GREATER_THAN_ZERO: "Bill amount must be greater than 0.",
  FILTERED: "Filtered",
};

// Recurrence Types
export const RECURRENCE_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

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
  viewPeriod: VIEW_PERIODS.MONTHLY,
  viewType: VIEW_TYPES.LIST,
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  selectedCategory: "",
  searchQuery: "",
};

// Currency Symbol
export const CURRENCY_SYMBOL = "₹";

// Date Format
export const DATE_FORMAT = "DD-MM-YYYY";

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
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#34495e",
    "#e91e63",
    "#ff5722",
    "#00bcd4",
    "#607d8b",
    "#ff9800",
    "#9c27b0",
    "#795548",
  ],
  HEIGHT: 300,
  MARGIN: { top: 20, right: 30, left: 20, bottom: 20 },
  PIE_OUTER_RADIUS: 100,
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
};

// Display Limits
export const DISPLAY_LIMITS = {
  TOP_CATEGORIES: 8,
  PREVIEW_ITEMS: 5,
  PREVIEW_ROWS: 50,
  TOP_CATEGORIES_ANALYSIS: 10,
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

// Category Detection Patterns
export const CATEGORY_PATTERNS = {
  INCOME: {
    [INCOME_CATEGORIES.SALARY]: [
      "salary",
      "payroll",
      "wage",
      "pay",
      "compensation",
      "income",
    ],
    [INCOME_CATEGORIES.FREELANCE]: [
      "freelance",
      "consulting",
      "contract",
      "gig",
      "project",
    ],
    [INCOME_CATEGORIES.INVESTMENT]: [
      "investment",
      "dividend",
      "interest",
      "return",
      "profit",
      "capital gain",
    ],
    [INCOME_CATEGORIES.RENTAL]: ["rent", "rental", "lease", "property income"],
    [INCOME_CATEGORIES.BONUS]: ["bonus", "incentive", "reward", "commission"],
    [INCOME_CATEGORIES.BUSINESS]: [
      "business",
      "sale",
      "revenue",
      "income from business",
    ],
  },
  EXPENSE: {
    [EXPENSE_CATEGORIES.GROCERIES]: [
      "grocery",
      "supermarket",
      "food",
      "vegetable",
      "mart",
      "store",
      "provision",
    ],
    [EXPENSE_CATEGORIES.HOUSING]: [
      "rent",
      "housing",
      "mortgage",
      "emi",
      "home loan",
      "maintenance",
    ],
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
    [EXPENSE_CATEGORIES.DINING]: [
      "restaurant",
      "dining",
      "cafe",
      "food delivery",
      "zomato",
      "swiggy",
      "hotel",
    ],
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
    [EXPENSE_CATEGORIES.HEALTHCARE]: [
      "medical",
      "hospital",
      "pharmacy",
      "health",
      "doctor",
      "medicine",
      "clinic",
    ],
    [EXPENSE_CATEGORIES.EDUCATION]: [
      "education",
      "school",
      "tuition",
      "college",
      "course",
      "fee",
    ],
    [EXPENSE_CATEGORIES.SHOPPING]: [
      "shopping",
      "mall",
      "store",
      "amazon",
      "flipkart",
      "purchase",
      "buy",
    ],
    [EXPENSE_CATEGORIES.ENTERTAINMENT]: [
      "entertainment",
      "movie",
      "netflix",
      "streaming",
      "spotify",
      "game",
      "cinema",
    ],
    [EXPENSE_CATEGORIES.INSURANCE]: ["insurance", "premium", "policy"],
    [EXPENSE_CATEGORIES.SUBSCRIPTIONS]: [
      "subscription",
      "membership",
      "recurring",
      "auto-debit",
    ],
    [EXPENSE_CATEGORIES.TRAVEL]: [
      "travel",
      "vacation",
      "trip",
      "hotel booking",
      "booking",
    ],
    [EXPENSE_CATEGORIES.PERSONAL_CARE]: [
      "salon",
      "spa",
      "beauty",
      "gym",
      "fitness",
    ],
    [EXPENSE_CATEGORIES.GIFTS]: ["gift", "donation", "charity"],
    [EXPENSE_CATEGORIES.BONDS]: [
      "bonds",
      "bond",
      "government bond",
      "corporate bond",
    ],
    [EXPENSE_CATEGORIES.ELSS]: [
      "elss",
      "equity linked savings scheme",
      "tax saving mutual fund",
    ],
    [EXPENSE_CATEGORIES.ETF]: ["etf", "exchange traded fund", "index fund"],
    [EXPENSE_CATEGORIES.INVESTMENTS]: [
      "investment",
      "invest",
      "portfolio",
      "asset",
      "capital",
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
    ],
    [EXPENSE_CATEGORIES.MISC_EXPENSES]: [
      "misc",
      "miscellaneous",
      "other expense",
      "various",
    ],
    [EXPENSE_CATEGORIES.MUTUAL_FUNDS]: [
      "mutual fund",
      "mf",
      "sip",
      "equity fund",
      "debt fund",
      "hybrid fund",
    ],
    [EXPENSE_CATEGORIES.NPS]: ["nps", "national pension scheme", "pension"],
    [EXPENSE_CATEGORIES.PPF]: [
      "ppf",
      "public provident fund",
      "provident fund",
    ],
    [EXPENSE_CATEGORIES.REIT]: ["reit", "real estate investment trust"],
    [EXPENSE_CATEGORIES.SIP]: [
      "sip",
      "systematic investment plan",
      "mutual fund sip",
    ],
  },
};

// Bank Statement Column Mapping Patterns
export const COLUMN_MAPPING_PATTERNS = {
  SERIAL: [
    "serial",
    "s.no",
    "sr no",
    "sno",
    "sl no",
    "sl. no",
    "sr.",
    "no.",
    "number",
  ],
  DATE: [
    "date",
    "transaction date",
    "txn date",
    "value date",
    "posting date",
    "transaction_date",
    "txn_date",
  ],
  MODE: [
    "mode",
    "transaction mode",
    "payment mode",
    "payment_method",
    "transaction_mode",
    "method",
  ],
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
  DEPOSITS: [
    "deposit",
    "deposits",
    "credit",
    "cr",
    "credit amount",
    "deposit amount",
    "amount (cr)",
    "amount(cr)",
  ],
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
  AMOUNT: [
    "amount",
    "transaction amount",
    "amount(inr)",
    "amount (inr)",
    "amount(inr)",
    "transaction_amount",
  ],
  BALANCE: [
    "balance",
    "closing balance",
    "running balance",
    "available balance",
    "balance amount",
  ],
  TYPE: [
    "type",
    "debit/credit",
    "dr/cr",
    "cr/dr",
    "transaction type",
    "credit/debit",
  ],
};
