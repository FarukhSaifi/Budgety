import type { ParsedStatementTransaction } from "@/lib/statement/types";

/** Classification of a CRED Protect (or related) email. */
export type CredEmailKind = "bill" | "spend" | "other";

/** Parsed CRED email ready for Bills / Review routing. */
export interface ParsedCredEmail {
  messageId: string;
  kind: CredEmailKind;
  subject: string;
  snippet: string;
  /** Issuer / product name, e.g. "ICICI Bank". */
  cardIssuer: string | null;
  /** Last 4 digits when present. */
  cardLast4: string | null;
  /** Billing month label from body/subject, e.g. "November". */
  billingMonthLabel: string | null;
  /** YYYY-MM for the bill cycle when resolvable. */
  billingPeriod: string | null;
  /** Total amount due (preferred) or transaction amount. */
  amount: number | null;
  minimumDue: number | null;
  /** Due date in storage format YYYY-MM-DD. */
  dueDate: string | null;
  /** Statement / alert date YYYY-MM-DD. */
  emailDate: string;
}

/** Draft bill payload returned by Cred sync for client upsert. */
export interface CredBillDraft {
  /** Deterministic Firestore doc id for upsert. */
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  source: string;
  reminderDays: number;
  recurrence: "monthly";
  status: "pending";
  isPaid: false;
  isRecurring: true;
  messageId: string;
  cardLast4: string | null;
  billingPeriod: string | null;
}

export interface CredSyncResult {
  emailsScanned: number;
  bills: CredBillDraft[];
  /** Spend-like alerts staged for Import Review (same shape as bank alerts). */
  spendTransactions: ParsedStatementTransaction[];
  skippedOther: number;
  errors: string[];
}
