import type { GmailLockedAttachment, GmailSyncOptions } from "@/types/gmail";

import type { DuplicateCheckable } from "@utils/duplicateDetection";

import type { ParsedStatementTransaction } from "@/lib/statement/types";

export interface SyncRequestBody extends GmailSyncOptions {
  userId?: string;
  existingTransactions?: DuplicateCheckable[];
}

export interface MessageParseResult {
  parsed: ParsedStatementTransaction[];
  locked: GmailLockedAttachment[];
  errors: string[];
  statementAttachmentsFound: number;
  alertEmailsFound: number;
}
