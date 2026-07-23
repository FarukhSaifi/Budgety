import { DEFAULT_CATEGORY_COLOR } from "@constants/firestore";

import type { Category, TransactionType } from "@/types";

/**
 * One-time seed payload written to Firestore when a user has zero categories.
 * Runtime UI must read categories from Firestore — not from this module.
 */
export type CategorySeed = Pick<Category, "name" | "type" | "color"> & { isDefault: true };

const income: CategorySeed[] = [
  { name: "Salary", type: "income", color: "#28b9b5", isDefault: true },
  { name: "Freelance", type: "income", color: "#2ecc71", isDefault: true },
  { name: "Investment", type: "income", color: "#3498db", isDefault: true },
  { name: "Business", type: "income", color: "#9b59b6", isDefault: true },
  { name: "Rental Income", type: "income", color: "#1abc9c", isDefault: true },
  { name: "Bonus", type: "income", color: "#16a085", isDefault: true },
  { name: "Other", type: "income", color: "#95a5a6", isDefault: true },
];

const expense: CategorySeed[] = [
  { name: "Bonds", type: "expense", color: "#8e44ad", isDefault: true },
  { name: "Dining Out", type: "expense", color: "#e91e63", isDefault: true },
  { name: "Education", type: "expense", color: "#34495e", isDefault: true },
  { name: "ELSS", type: "expense", color: "#16a085", isDefault: true },
  { name: "Entertainment", type: "expense", color: "#9b59b6", isDefault: true },
  { name: "ETF", type: "expense", color: "#27ae60", isDefault: true },
  { name: "Gifts & Donations", type: "expense", color: "#9c27b0", isDefault: true },
  { name: "Groceries", type: "expense", color: "#f39c12", isDefault: true },
  { name: "Healthcare", type: "expense", color: "#e67e22", isDefault: true },
  { name: "Home Expense", type: "expense", color: "#c17f59", isDefault: true },
  { name: "Housing", type: "expense", color: "#e74c3c", isDefault: true },
  { name: "Insurance", type: "expense", color: "#607d8b", isDefault: true },
  { name: "Investments", type: "expense", color: "#3498db", isDefault: true },
  { name: "Loan Payments", type: "expense", color: "#c0392b", isDefault: true },
  { name: "Miscellaneous Expenses", type: "expense", color: "#95a5a6", isDefault: true },
  { name: "Mutual Funds", type: "expense", color: "#2980b9", isDefault: true },
  { name: "NPS", type: "expense", color: "#1abc9c", isDefault: true },
  { name: "Other", type: "expense", color: "#d2d2d2", isDefault: true },
  { name: "Personal Care", type: "expense", color: "#ff9800", isDefault: true },
  { name: "PPF", type: "expense", color: "#16a085", isDefault: true },
  { name: "REIT", type: "expense", color: "#27ae60", isDefault: true },
  { name: "Shopping", type: "expense", color: "#ff5722", isDefault: true },
  { name: "SIP", type: "expense", color: "#2980b9", isDefault: true },
  { name: "Subscriptions", type: "expense", color: "#795548", isDefault: true },
  { name: "Transportation", type: "expense", color: "#3498db", isDefault: true },
  { name: "Travel", type: "expense", color: "#00bcd4", isDefault: true },
  { name: "Utilities", type: "expense", color: "#1abc9c", isDefault: true },
  { name: "Credit Card", type: "expense", color: "#ff5767", isDefault: true },
  { name: "Stocks", type: "expense", color: "#1565c0", isDefault: true },
  { name: "REITS", type: "expense", color: "#00897b", isDefault: true },
  { name: "P2P", type: "expense", color: "#6d4c41", isDefault: true },
  { name: "Crypto", type: "expense", color: "#f9a825", isDefault: true },
];

export const DEFAULT_CATEGORY_SEEDS: CategorySeed[] = [...income, ...expense];

export function resolveCategoryColor(color?: string | null): string {
  const trimmed = String(color ?? "").trim();
  return trimmed || DEFAULT_CATEGORY_COLOR;
}

export function buildCategorySeedDocs(
  userId: string,
): Array<Omit<Category, "id"> & { isDefault: true }> {
  const createdAt = new Date().toISOString();
  return DEFAULT_CATEGORY_SEEDS.map((seed) => ({
    userId,
    name: seed.name,
    type: seed.type as TransactionType,
    color: resolveCategoryColor(seed.color),
    isDefault: true,
    createdAt,
  }));
}
