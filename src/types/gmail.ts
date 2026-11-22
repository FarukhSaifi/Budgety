import type { CredBillDraft } from "@/lib/gmail/credParser.types";
import type { AiNearDuplicateMeta } from "@/lib/statement/aiNearDuplicate.types";
import type { ParsedStatementTransaction } from "@/lib/statement/types";

export interface GmailConnectionStatus {
  connected: boolean;
  email?: string | null;
  lastSyncAt?: string | null;
  expiresAt?: number | null;
  autoSyncEnabled?: boolean;
  autoSyncIntervalHours?: number;
}

export interface GmailSyncOptions {
  daysBack?: number;
  startDate?: string;
  endDate?: string;
  includeAlerts?: boolean;
  includeAttachments?: boolean;
  /** When true (default), also fetch CRED Protect CC bills. */
  includeCred?: boolean;
  pdfPassword?: string;
  maxEmails?: number;
}

/** Password-locked Gmail PDF that can be unlocked later in Import Review. */
export interface GmailLockedAttachment {
  /** Stable key: `${messageId}:${attachmentId}` */
  id: string;
  messageId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  /** Short bank/issuer chip (e.g. HDFC, ICICI) — format guidance only. */
  bankLabel?: string;
  /** Password *format* hint from email instructions — never an actual password. */
  passwordHint?: string;
  /** Email subject (for UI / backfill). */
  subject?: string;
  /** From header (for bank backfill). */
  from?: string;
}

export interface GmailSyncStats {
  emailsScanned: number;
  statementAttachmentsFound: number;
  alertEmailsFound: number;
  totalParsed: number;
  newCount: number;
  duplicatesCount: number;
  errors: string[];
  lockedAttachments: GmailLockedAttachment[];
  /** CRED Protect emails scanned in this sync. */
  credEmailsScanned?: number;
  /** CRED bill drafts ready for Bills upsert. */
  credBillsFound?: number;
}

export interface GmailSyncResponse {
  transactions: ParsedStatementTransaction[];
  /** CRED CC bill drafts — client upserts into Bills (deterministic ids). */
  credBills?: CredBillDraft[];
  meta: GmailSyncStats & {
    discoveredCategories?: {
      income: string[];
      expense: string[];
    };
    /** AI second-pass near-duplicate meta (graceful skip when unavailable). */
    aiNearDuplicate?: AiNearDuplicateMeta;
  };
}

export interface GmailUnlockAttachmentRequest {
  userId: string;
  messageId: string;
  attachmentId: string;
  filename?: string;
  pdfPassword: string;
}
