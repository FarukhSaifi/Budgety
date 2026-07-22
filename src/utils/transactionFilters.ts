import type { Transaction } from "@/types";

const TRANSFER_MODES = new Set([
  "Bank Transfer",
  "NEFT",
  "IMPS",
  "RTGS",
  "UPI",
]);

/** UI-only Transfer filter: payment modes or title/description containing "transfer". */
export function isTransferTransaction(t: Transaction): boolean {
  const mode = t.paymentMode || t.mode || "";
  if (TRANSFER_MODES.has(mode)) return true;
  const text = `${t.title || ""} ${t.description || ""}`.toLowerCase();
  return text.includes("transfer");
}

export function filterByTransactionType(
  transactions: Transaction[],
  filter: "all" | "income" | "expense" | "transfer",
): Transaction[] {
  if (filter === "all") return transactions;
  if (filter === "transfer") return transactions.filter(isTransferTransaction);
  return transactions.filter((t) => t.type === filter);
}

/** Percent change of current vs previous; null when previous is 0. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
