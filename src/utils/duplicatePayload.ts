import type { DuplicateCheckable } from "@utils/duplicateDetection";

/**
 * Slim ledger rows for Gmail sync dedupe payloads (avoids sending full Redux objects).
 */
export function toDuplicateCheckPayload(
  transactions: Array<{
    date: string;
    type: string;
    amount: number;
    title?: string;
    description?: string;
  }>,
): DuplicateCheckable[] {
  return transactions.map((tx) => ({
    date: tx.date,
    type: tx.type,
    amount: tx.amount,
    title: tx.title,
    description: tx.description,
  }));
}
