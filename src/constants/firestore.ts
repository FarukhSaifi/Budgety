/** Firestore collection names — top-level, always scoped by userId field. */
export const FIRESTORE_COLLECTIONS = {
  TRANSACTIONS: "transactions",
  BUDGETS: "budgets",
  BILLS: "bills",
  GOALS: "goals",
  RECURRING: "recurringTransactions",
  CATEGORIES: "categories",
  RULES: "rules",
  DEBTS: "debts",
  SPLIT_EXPENSES: "splitExpenses",
  SPLIT_PARTICIPANTS: "splitParticipants",
} as const;

/** All supported payment modes (baseline + legacy). Mirrors the PaymentMode union. */
export const PAYMENT_MODES_LIST = [
  "Cash",
  "Card",
  "UPI",
  "Net Banking",
  "Cheque",
  "Bank Transfer",
  "Wallet",
  "NEFT",
  "IMPS",
  "RTGS",
  "Other",
] as const;

/** Fallback tag color when a category document has no color. */
export const DEFAULT_CATEGORY_COLOR = "#f2f2f2";
