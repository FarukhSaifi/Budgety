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
  NET_WORTH: "netWorthItems",
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

/**
 * Windowed sync + write safeguards for Spark (free) quota.
 * Transactions use (userId, date) indexes; imports are chunked and capped.
 */
export const FIRESTORE_QUERY = {
  /** Recent listener / load-older page size (newest first). */
  TRANSACTIONS_PAGE_SIZE: 250,
  /** Firestore batch write limit is 500; stay under it. */
  WRITE_BATCH_CHUNK: 400,
  /** Soft cap per import to avoid burning daily write quota in one shot. */
  IMPORT_MAX_ROWS: 1500,
  /** Brief pause between write chunks (ms) to spread quota usage. */
  WRITE_CHUNK_PAUSE_MS: 75,
} as const;
