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
  pdfPassword?: string;
  maxEmails?: number;
}

export interface GmailSyncStats {
  emailsScanned: number;
  statementAttachmentsFound: number;
  alertEmailsFound: number;
  totalParsed: number;
  newCount: number;
  duplicatesCount: number;
  errors: string[];
}

export interface GmailSyncResponse {
  transactions: ParsedStatementTransaction[];
  meta: GmailSyncStats & {
    discoveredCategories?: {
      income: string[];
      expense: string[];
    };
  };
}
