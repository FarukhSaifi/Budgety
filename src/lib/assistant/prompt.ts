import { CURRENCY_SYMBOL } from "@constants";

export type FinanceSnapshot = {
  periodLabel?: string;
  income?: number;
  expense?: number;
  net?: number;
  currentBalance?: number;
  netWorth?: number;
  safeToSpend?: number;
  spendingByCategory?: { category: string; amount: number }[];
  budgets?: { category: string; limit: number; spent: number }[];
  upcomingBills?: { title: string; amount: number; dueDate: string }[];
  recentTransactions?: {
    date: string;
    title: string;
    category: string;
    amount: number;
    type: string;
  }[];
  /** Compact goals blurb from the client (optional). */
  goalsSummary?: string;
};

export function buildAssistantSystemPrompt(): string {
  return [
    "You are Budgety’s money coach — calm, clear, and practical.",
    `Currency is Indian Rupees (${CURRENCY_SYMBOL}). Format money with ${CURRENCY_SYMBOL} and commas.`,
    "Answer ONLY using the FinanceSnapshot JSON provided in the user message.",
    "If data is missing to answer, say so briefly and suggest checking Transactions.",
    "Never invent balances, transactions, or budgets.",
    "For “roast” requests: be witty and specific to categories/amounts, never shaming or cruel.",
    "For affordability: compare the ask vs safe-to-spend and remaining category/budget when present.",
    "Keep answers short (2–6 sentences) unless the user asks for detail.",
    "Do not mutate data or claim you changed anything.",
  ].join("\n");
}

export function formatSnapshotForPrompt(snapshot: FinanceSnapshot): string {
  const capped: FinanceSnapshot = {
    ...snapshot,
    spendingByCategory: (snapshot.spendingByCategory ?? []).slice(0, 15),
    budgets: (snapshot.budgets ?? []).slice(0, 12),
    upcomingBills: (snapshot.upcomingBills ?? []).slice(0, 12),
    recentTransactions: (snapshot.recentTransactions ?? []).slice(0, 30),
  };
  return JSON.stringify(capped);
}
