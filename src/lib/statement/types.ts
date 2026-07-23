import type { PaymentMode, TransactionType } from "@/types";

/** Transaction shape returned by `/api/parse-statement` (pre–userId/id). */
export interface ParsedStatementTransaction {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  date: string;
  isRecurring: false;
  imported: true;
  /** Legacy alias — mirrors title. */
  description?: string;
  /** Legacy alias — mirrors paymentMode. */
  mode?: string;
}

export type StatementFileKind = "csv" | "pdf";

export interface DiscoveredCategories {
  income: string[];
  expense: string[];
}

export interface ParseStatementSuccess {
  transactions: ParsedStatementTransaction[];
  meta: {
    source: StatementFileKind;
    count: number;
    /** Novel category names invented by AI (client should persist via addCategory). */
    discoveredCategories?: DiscoveredCategories;
  };
}

export interface ParseStatementError {
  error: string;
}
