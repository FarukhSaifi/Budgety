import { ERROR_MESSAGES } from "@constants";

/**
 * Budgety API client – all persistence goes through Next.js API routes (Neon DB).
 * Requests are same-origin (/api/...) so no CORS or proxy needed.
 */
const api = (path, options = {}) => {
  return fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  }).then(async (res) => {
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(
        data.error || res.statusText || ERROR_MESSAGES.REQUEST_FAILED,
      );
    return data;
  });
};

export const budgetyApi = {
  getState: () => api("/api/state"),

  getTransactions: () => api("/api/transactions"),
  addTransaction: (body) =>
    api("/api/transactions", { method: "POST", body: JSON.stringify(body) }),
  addTransactionsBulk: (transactions) =>
    api("/api/transactions/bulk", {
      method: "POST",
      body: JSON.stringify({ transactions }),
    }),
  updateTransaction: (id, body) =>
    api(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTransaction: (id) =>
    api(`/api/transactions/${id}`, { method: "DELETE" }),
  deleteImportedTransactions: () =>
    api("/api/transactions/delete-imported", { method: "POST" }),

  getSavingsGoals: () => api("/api/savings-goals"),
  addSavingsGoal: (body) =>
    api("/api/savings-goals", { method: "POST", body: JSON.stringify(body) }),
  updateSavingsGoal: (id, body) =>
    api(`/api/savings-goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteSavingsGoal: (id) =>
    api(`/api/savings-goals/${id}`, { method: "DELETE" }),

  getBudgets: () => api("/api/budgets"),
  addBudget: (body) =>
    api("/api/budgets", { method: "POST", body: JSON.stringify(body) }),
  updateBudget: (id, body) =>
    api(`/api/budgets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBudget: (id) => api(`/api/budgets/${id}`, { method: "DELETE" }),

  getRecurringTransactions: () => api("/api/recurring-transactions"),
  addRecurringTransaction: (body) =>
    api("/api/recurring-transactions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateRecurringTransaction: (id, body) =>
    api(`/api/recurring-transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteRecurringTransaction: (id) =>
    api(`/api/recurring-transactions/${id}`, { method: "DELETE" }),

  getBillReminders: () => api("/api/bill-reminders"),
  addBillReminder: (body) =>
    api("/api/bill-reminders", { method: "POST", body: JSON.stringify(body) }),
  updateBillReminder: (id, body) =>
    api(`/api/bill-reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteBillReminder: (id) =>
    api(`/api/bill-reminders/${id}`, { method: "DELETE" }),
};
