import type { GmailSyncResponse } from "@/types/gmail";

import type { ParsedStatementTransaction } from "@/lib/statement/types";

export interface GmailSyncPanelProps {
  onTransactionsFetched: (
    transactions: ParsedStatementTransaction[],
    meta: GmailSyncResponse["meta"],
  ) => void;
}
