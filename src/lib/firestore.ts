import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type FirestoreError,
  type QuerySnapshot,
} from "firebase/firestore";

import { FIRESTORE_COLLECTIONS, FIRESTORE_QUERY, PAYMENT_MODES_LIST } from "@constants/firestore";

import { toStorageDate, todayStorage } from "@utils/dateUtils";

import { buildCategorySeedDocs, resolveCategoryColor } from "@/lib/categoryDefaults";
import { db } from "@/lib/firebase";
import type {
  Bill,
  BillStatus,
  Budget,
  CategorizationRule,
  Category,
  Debt,
  DebtKind,
  Goal,
  NetWorthItem,
  NetWorthKind,
  PaymentMode,
  RecurringTransaction,
  SplitExpense,
  SplitParticipant,
  Transaction,
  TransactionType,
} from "@/types";

function requireDb() {
  if (!db) {
    throw new Error("Firestore is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  }
  return db;
}

/** Normalize any date input to YYYY-MM-DD for storage and month filters. */
function normalizeTxDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return todayStorage();
  const stored = toStorageDate(raw);
  if (stored) return stored;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return todayStorage();
}

function normalizePaymentMode(value: unknown): PaymentMode {
  const mode = String(value || "Cash");
  return (PAYMENT_MODES_LIST.includes(mode as PaymentMode) ? mode : "Cash") as PaymentMode;
}

function deriveBillStatus(data: DocumentData): BillStatus {
  if (data.status === "paid" || data.status === "pending" || data.status === "overdue") {
    return data.status;
  }
  if (data.isPaid) return "paid";
  const due = data.dueDate ? new Date(data.dueDate) : null;
  if (due && !Number.isNaN(due.getTime()) && due < new Date()) return "overdue";
  return "pending";
}

export function mapTransactionDoc(id: string, data: DocumentData): Transaction {
  const title = String(data.title ?? data.description ?? "");
  const paymentMode = normalizePaymentMode(data.paymentMode ?? data.mode);
  return {
    id,
    userId: String(data.userId ?? ""),
    title,
    amount: Number(data.amount) || 0,
    type: data.type === "income" ? "income" : "expense",
    category: String(data.category ?? "Other"),
    paymentMode,
    date: normalizeTxDate(data.date),
    isRecurring: Boolean(data.isRecurring),
    description: title,
    mode: paymentMode,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    imported: Boolean(data.imported),
    taxDeductible: Boolean(data.taxDeductible),
    isShared: Boolean(data.isShared),
  };
}

export function toTransactionWrite(tx: Partial<Transaction> & { userId: string }) {
  const title = tx.title ?? tx.description ?? "";
  const paymentMode = normalizePaymentMode(tx.paymentMode ?? tx.mode);
  return {
    userId: tx.userId,
    title,
    amount: Number(tx.amount) || 0,
    type: tx.type === "income" ? "income" : "expense",
    category: tx.category ?? "Other",
    paymentMode,
    date: normalizeTxDate(tx.date),
    isRecurring: Boolean(tx.isRecurring),
    createdAt: tx.createdAt ?? new Date().toISOString(),
    imported: Boolean(tx.imported),
    taxDeductible: Boolean(tx.taxDeductible),
    isShared: Boolean(tx.isShared),
  };
}

export function mapBudgetDoc(id: string, data: DocumentData): Budget {
  const limitAmount = Number(data.limitAmount ?? data.limit ?? data.amount) || 0;
  return {
    id,
    userId: String(data.userId ?? ""),
    category: String(data.category ?? ""),
    limitAmount,
    amount: limitAmount,
    currentAmount: Number(data.currentAmount) || 0,
    period: data.period === "yearly" ? "yearly" : "monthly",
    month: data.month != null ? Number(data.month) : undefined,
    year: data.year != null ? Number(data.year) : undefined,
    rollover: Boolean(data.rollover),
    rolloverBalance: Number(data.rolloverBalance) || 0,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toBudgetWrite(b: Partial<Budget> & { userId: string }) {
  return {
    userId: b.userId,
    category: b.category ?? "",
    limitAmount: Number(b.limitAmount) || 0,
    currentAmount: Number(b.currentAmount) || 0,
    period: b.period === "yearly" ? "yearly" : "monthly",
    month: b.month ?? null,
    year: b.year ?? null,
    rollover: Boolean(b.rollover),
    rolloverBalance: Number(b.rolloverBalance) || 0,
    createdAt: b.createdAt ?? new Date().toISOString(),
  };
}

export function mapBillDoc(id: string, data: DocumentData): Bill {
  const title = String(data.title ?? data.name ?? "");
  const status = deriveBillStatus(data);
  return {
    id,
    userId: String(data.userId ?? ""),
    title,
    amount: Number(data.amount) || 0,
    dueDate: String(data.dueDate ?? ""),
    recurrence: (data.recurrence as Bill["recurrence"]) || "monthly",
    status,
    name: title,
    isPaid: status === "paid",
    paidDate: data.paidDate ? String(data.paidDate) : null,
    isRecurring: data.isRecurring !== false,
    reminderDays: Number(data.reminderDays) || 3,
    category: data.category ? String(data.category) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toBillWrite(b: Partial<Bill> & { userId: string }) {
  const title = b.title ?? b.name ?? "";
  const status: BillStatus = b.status ?? (b.isPaid ? "paid" : "pending");
  return {
    userId: b.userId,
    title,
    amount: Number(b.amount) || 0,
    dueDate: b.dueDate ?? new Date().toISOString(),
    recurrence: b.recurrence ?? "monthly",
    status,
    isPaid: status === "paid",
    paidDate: b.paidDate ?? null,
    isRecurring: b.isRecurring !== false,
    reminderDays: b.reminderDays ?? 3,
    category: b.category ?? null,
    createdAt: b.createdAt ?? new Date().toISOString(),
  };
}

export function mapGoalDoc(id: string, data: DocumentData): Goal {
  const title = String(data.title ?? data.name ?? "");
  const savedAmount = Number(data.savedAmount ?? data.currentAmount) || 0;
  return {
    id,
    userId: String(data.userId ?? ""),
    title,
    targetAmount: Number(data.targetAmount) || 0,
    savedAmount,
    targetDate: String(data.targetDate ?? data.createdAt ?? new Date().toISOString()),
    name: title,
    currentAmount: savedAmount,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toGoalWrite(g: Partial<Goal> & { userId: string }) {
  const title = g.title ?? g.name ?? "";
  const savedAmount = Number(g.savedAmount ?? g.currentAmount) || 0;
  return {
    userId: g.userId,
    title,
    targetAmount: Number(g.targetAmount) || 0,
    savedAmount,
    targetDate: g.targetDate ?? new Date().toISOString(),
    createdAt: g.createdAt ?? new Date().toISOString(),
  };
}

export function mapRecurringDoc(id: string, data: DocumentData): RecurringTransaction {
  return {
    id,
    userId: String(data.userId ?? ""),
    type: data.type === "income" ? "income" : "expense",
    description: String(data.description ?? data.title ?? ""),
    category: String(data.category ?? "Other"),
    amount: Number(data.amount) || 0,
    recurrence: (data.recurrence as RecurringTransaction["recurrence"]) || "monthly",
    startDate: String(data.startDate ?? ""),
    endDate: data.endDate ? String(data.endDate) : null,
    isActive: data.isActive !== false,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toRecurringWrite(r: Partial<RecurringTransaction> & { userId: string }) {
  return {
    userId: r.userId,
    type: r.type === "income" ? "income" : "expense",
    description: r.description ?? "",
    category: r.category ?? "Other",
    amount: Number(r.amount) || 0,
    recurrence: r.recurrence ?? "monthly",
    startDate: r.startDate ?? new Date().toISOString(),
    endDate: r.endDate ?? null,
    isActive: r.isActive !== false,
    createdAt: r.createdAt ?? new Date().toISOString(),
  };
}

export function mapCategoryDoc(id: string, data: DocumentData): Category {
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? "").trim(),
    type: data.type === "income" ? "income" : "expense",
    color: resolveCategoryColor(data.color),
    isDefault: Boolean(data.isDefault),
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toCategoryWrite(c: Partial<Category> & { userId: string; name: string; type: TransactionType }) {
  return {
    userId: c.userId,
    name: String(c.name ?? "")
      .trim()
      .replace(/\s+/g, " "),
    type: c.type === "income" ? "income" : "expense",
    color: resolveCategoryColor(c.color),
    isDefault: Boolean(c.isDefault),
    createdAt: c.createdAt ?? new Date().toISOString(),
  };
}

export function mapRuleDoc(id: string, data: DocumentData): CategorizationRule {
  const transactionType =
    data.transactionType === "income" || data.transactionType === "expense" ? data.transactionType : "any";
  const matchContainsAny = Array.isArray(data.matchContainsAny)
    ? data.matchContainsAny.map((s: unknown) => String(s ?? "").trim()).filter(Boolean)
    : undefined;
  const paymentMode =
    typeof data.paymentMode === "string" && data.paymentMode
      ? (data.paymentMode as CategorizationRule["paymentMode"])
      : undefined;
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? ""),
    matchContains: String(data.matchContains ?? ""),
    matchContainsAny,
    category: String(data.category ?? ""),
    paymentMode,
    transactionType,
    isActive: data.isActive !== false,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toRuleWrite(r: Partial<CategorizationRule> & { userId: string }) {
  const matchContainsAny = (r.matchContainsAny ?? []).map((s) => String(s ?? "").trim()).filter(Boolean);
  const matchContains = String(r.matchContains ?? "").trim() || matchContainsAny[0] || "";
  return {
    userId: r.userId,
    name: r.name ?? "",
    matchContains,
    matchContainsAny,
    category: r.category ?? "",
    ...(r.paymentMode ? { paymentMode: r.paymentMode } : {}),
    transactionType: r.transactionType ?? "any",
    isActive: r.isActive !== false,
    createdAt: r.createdAt ?? new Date().toISOString(),
  };
}

export function mapDebtDoc(id: string, data: DocumentData): Debt {
  const kind = (["loan", "credit_card", "other"] as DebtKind[]).includes(data.kind) ? (data.kind as DebtKind) : "other";
  return {
    id,
    userId: String(data.userId ?? ""),
    title: String(data.title ?? ""),
    kind,
    principal: Number(data.principal) || 0,
    balance: Number(data.balance) || 0,
    interestRate: Number(data.interestRate) || 0,
    minimumPayment: Number(data.minimumPayment) || 0,
    dueDay: data.dueDay != null ? Number(data.dueDay) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toDebtWrite(d: Partial<Debt> & { userId: string }) {
  return {
    userId: d.userId,
    title: d.title ?? "",
    kind: d.kind ?? "other",
    principal: Number(d.principal) || 0,
    balance: Number(d.balance) || 0,
    interestRate: Number(d.interestRate) || 0,
    minimumPayment: Number(d.minimumPayment) || 0,
    dueDay: d.dueDay ?? null,
    createdAt: d.createdAt ?? new Date().toISOString(),
  };
}

const NET_WORTH_KINDS: NetWorthKind[] = ["bank", "cash", "investment", "property", "vehicle", "other_asset"];

export function mapNetWorthDoc(id: string, data: DocumentData): NetWorthItem {
  const kind = NET_WORTH_KINDS.includes(data.kind) ? (data.kind as NetWorthKind) : "other_asset";
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? ""),
    kind,
    balance: Number(data.balance) || 0,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toNetWorthWrite(item: Partial<NetWorthItem> & { userId: string }) {
  const now = new Date().toISOString();
  return {
    userId: item.userId,
    name: item.name ?? "",
    kind: item.kind ?? "other_asset",
    balance: Number(item.balance) || 0,
    updatedAt: item.updatedAt ?? now,
    createdAt: item.createdAt ?? now,
  };
}

export function mapSplitParticipantDoc(id: string, data: DocumentData): SplitParticipant {
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? "").trim(),
  };
}

export function toSplitParticipantWrite(p: Partial<SplitParticipant> & { userId: string; name: string }) {
  return {
    userId: p.userId,
    name: String(p.name ?? "").trim(),
  };
}

export function mapSplitExpenseDoc(id: string, data: DocumentData): SplitExpense {
  return {
    id,
    userId: String(data.userId ?? ""),
    title: String(data.title ?? ""),
    amount: Number(data.amount) || 0,
    date: normalizeTxDate(data.date),
    paidById: String(data.paidById ?? ""),
    participantIds: Array.isArray(data.participantIds) ? data.participantIds.map((x: unknown) => String(x)) : [],
    transactionId: data.transactionId ? String(data.transactionId) : null,
    settled: Boolean(data.settled),
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
  };
}

export function toSplitExpenseWrite(e: Partial<SplitExpense> & { userId: string }) {
  return {
    userId: e.userId,
    title: e.title ?? "",
    amount: Number(e.amount) || 0,
    date: normalizeTxDate(e.date),
    paidById: e.paidById ?? "",
    participantIds: Array.isArray(e.participantIds) ? e.participantIds : [],
    transactionId: e.transactionId ?? null,
    settled: Boolean(e.settled),
    createdAt: e.createdAt ?? new Date().toISOString(),
  };
}

async function listByUserId<T>(
  collectionName: string,
  userId: string,
  mapper: (id: string, data: DocumentData) => T,
): Promise<T[]> {
  const firestore = requireDb();
  const q = query(collection(firestore, collectionName), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapper(d.id, d.data()));
}

/** Recent transactions window (newest first) — paired with composite (userId, date) index. */
async function listRecentTransactions(userId: string): Promise<Transaction[]> {
  const firestore = requireDb();
  const q = query(
    collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapTransactionDoc(d.id, d.data()));
}

function subscribeRecentTransactions(
  userId: string,
  onData: (items: Transaction[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb();
  const q = query(
    collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE),
  );
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => onData(snap.docs.map((d) => mapTransactionDoc(d.id, d.data()))),
    (error: FirestoreError) => onError?.(error),
  );
}

/** Unsubscribe function returned by real-time listeners. */
export type Unsubscribe = () => void;

/**
 * Real-time listener for a user-scoped collection. Every query is filtered by
 * `userId == uid` (see firestore.rules). Returns an unsubscribe function.
 */
function subscribeByUserId<T>(
  collectionName: string,
  userId: string,
  mapper: (id: string, data: DocumentData) => T,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const firestore = requireDb();
  const q = query(collection(firestore, collectionName), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap: QuerySnapshot<DocumentData>) => onData(snap.docs.map((d) => mapper(d.id, d.data()))),
    (error: FirestoreError) => onError?.(error),
  );
}

/** Real-time subscription factory grouped by domain (used by AuthBootstrap). */
export const firestoreListeners = {
  transactions: (userId: string, onData: (items: Transaction[]) => void, onError?: (e: Error) => void) =>
    subscribeRecentTransactions(userId, onData, onError),
  budgets: (userId: string, onData: (items: Budget[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.BUDGETS, userId, mapBudgetDoc, onData, onError),
  bills: (userId: string, onData: (items: Bill[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.BILLS, userId, mapBillDoc, onData, onError),
  goals: (userId: string, onData: (items: Goal[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.GOALS, userId, mapGoalDoc, onData, onError),
  recurring: (userId: string, onData: (items: RecurringTransaction[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.RECURRING, userId, mapRecurringDoc, onData, onError),
  categories: (userId: string, onData: (items: Category[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.CATEGORIES, userId, mapCategoryDoc, onData, onError),
  rules: (userId: string, onData: (items: CategorizationRule[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.RULES, userId, mapRuleDoc, onData, onError),
  debts: (userId: string, onData: (items: Debt[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.DEBTS, userId, mapDebtDoc, onData, onError),
  netWorthItems: (userId: string, onData: (items: NetWorthItem[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.NET_WORTH, userId, mapNetWorthDoc, onData, onError),
  splitExpenses: (userId: string, onData: (items: SplitExpense[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.SPLIT_EXPENSES, userId, mapSplitExpenseDoc, onData, onError),
  splitParticipants: (userId: string, onData: (items: SplitParticipant[]) => void, onError?: (e: Error) => void) =>
    subscribeByUserId(FIRESTORE_COLLECTIONS.SPLIT_PARTICIPANTS, userId, mapSplitParticipantDoc, onData, onError),
};

export const firestoreApi = {
  fetchTransactions: (userId: string) => listRecentTransactions(userId),

  /** Load the next older page before `beforeDate` (ISO day or full date string). */
  fetchOlderTransactions: async (userId: string, beforeDate: string): Promise<Transaction[]> => {
    const firestore = requireDb();
    const q = query(
      collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      startAfter(beforeDate),
      limit(FIRESTORE_QUERY.TRANSACTIONS_PAGE_SIZE),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapTransactionDoc(d.id, d.data()));
  },

  addTransaction: async (tx: Transaction) => {
    const firestore = requireDb();
    const payload = toTransactionWrite(tx);
    if (tx.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, tx.id), payload);
      return { ...mapTransactionDoc(tx.id, payload) };
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS), payload);
    return mapTransactionDoc(ref.id, payload);
  },

  addTransactionsBulk: async (items: Transaction[]) => {
    const firestore = requireDb();
    if (!items.length) return [];

    // Firestore batches are capped at 500 ops.
    const CHUNK = 400;
    const results: Transaction[] = [];

    for (let offset = 0; offset < items.length; offset += CHUNK) {
      const chunk = items.slice(offset, offset + CHUNK);
      const batch = writeBatch(firestore);
      for (const tx of chunk) {
        if (!tx.userId) {
          throw new Error("Cannot import transactions without a signed-in user.");
        }
        const payload = toTransactionWrite(tx);
        const id = tx.id || doc(collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS)).id;
        batch.set(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, id), payload);
        results.push(mapTransactionDoc(id, payload));
      }
      await batch.commit();
    }

    return results;
  },

  updateTransaction: async (id: string, userId: string, patch: Partial<Transaction>) => {
    const firestore = requireDb();
    const title = patch.title ?? patch.description;
    const paymentMode =
      patch.paymentMode != null || patch.mode != null
        ? normalizePaymentMode(patch.paymentMode ?? patch.mode)
        : undefined;
    const payload: DocumentData = { userId };
    if (title != null) payload.title = title;
    if (patch.amount != null) payload.amount = Number(patch.amount) || 0;
    if (patch.type != null) payload.type = patch.type === "income" ? "income" : "expense";
    if (patch.category != null) payload.category = patch.category;
    if (paymentMode != null) payload.paymentMode = paymentMode;
    if (patch.date != null) payload.date = normalizeTxDate(patch.date);
    if (patch.isRecurring != null) payload.isRecurring = Boolean(patch.isRecurring);
    if (patch.imported != null) payload.imported = Boolean(patch.imported);
    if (patch.taxDeductible != null) payload.taxDeductible = Boolean(patch.taxDeductible);
    if (patch.isShared != null) payload.isShared = Boolean(patch.isShared);
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapTransactionDoc(id, snap.data() ?? payload);
  },

  deleteTransaction: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, id));
  },

  deleteImportedTransactions: async (userId: string) => {
    const items = await listByUserId(FIRESTORE_COLLECTIONS.TRANSACTIONS, userId, mapTransactionDoc);
    const imported = items.filter((t) => t.imported);
    const firestore = requireDb();
    const CHUNK = 400;
    for (let offset = 0; offset < imported.length; offset += CHUNK) {
      const chunk = imported.slice(offset, offset + CHUNK);
      const batch = writeBatch(firestore);
      chunk.forEach((t) => {
        batch.delete(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, t.id));
      });
      await batch.commit();
    }
    return imported.map((t) => t.id);
  },

  deleteTransactionsByIds: async (ids: string[]) => {
    if (!ids.length) return [] as string[];
    const firestore = requireDb();
    const CHUNK = 400;
    const deleted: string[] = [];
    for (let offset = 0; offset < ids.length; offset += CHUNK) {
      const chunk = ids.slice(offset, offset + CHUNK);
      const batch = writeBatch(firestore);
      chunk.forEach((id) => {
        batch.delete(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, id));
        deleted.push(id);
      });
      await batch.commit();
    }
    return deleted;
  },

  fetchBudgets: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.BUDGETS, userId, mapBudgetDoc),

  addBudget: async (b: Budget) => {
    const firestore = requireDb();
    const payload = toBudgetWrite(b);
    if (b.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.BUDGETS, b.id), payload);
      return mapBudgetDoc(b.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.BUDGETS), payload);
    return mapBudgetDoc(ref.id, payload);
  },

  updateBudget: async (id: string, userId: string, patch: Partial<Budget>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.category != null) payload.category = patch.category;
    if (patch.limitAmount != null || patch.amount != null) {
      payload.limitAmount = Number(patch.limitAmount ?? patch.amount) || 0;
    }
    if (patch.currentAmount != null) payload.currentAmount = Number(patch.currentAmount) || 0;
    if (patch.period != null) payload.period = patch.period === "yearly" ? "yearly" : "monthly";
    if (patch.month !== undefined) payload.month = patch.month ?? null;
    if (patch.year !== undefined) payload.year = patch.year ?? null;
    if (patch.rollover != null) payload.rollover = Boolean(patch.rollover);
    if (patch.rolloverBalance != null) payload.rolloverBalance = Number(patch.rolloverBalance) || 0;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.BUDGETS, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapBudgetDoc(id, snap.data() ?? payload);
  },

  deleteBudget: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.BUDGETS, id));
  },

  fetchBills: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.BILLS, userId, mapBillDoc),

  addBill: async (b: Bill) => {
    const firestore = requireDb();
    const payload = toBillWrite(b);
    if (b.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.BILLS, b.id), payload);
      return mapBillDoc(b.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.BILLS), payload);
    return mapBillDoc(ref.id, payload);
  },

  updateBill: async (id: string, userId: string, patch: Partial<Bill>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    const title = patch.title ?? patch.name;
    if (title != null) payload.title = title;
    if (patch.amount != null) payload.amount = Number(patch.amount) || 0;
    if (patch.dueDate != null) payload.dueDate = patch.dueDate;
    if (patch.recurrence != null) payload.recurrence = patch.recurrence;
    if (patch.status != null || patch.isPaid != null) {
      const status: BillStatus = patch.status ?? (patch.isPaid ? "paid" : "pending");
      payload.status = status;
      payload.isPaid = status === "paid";
    }
    if (patch.paidDate !== undefined) payload.paidDate = patch.paidDate ?? null;
    if (patch.isRecurring != null) payload.isRecurring = patch.isRecurring !== false;
    if (patch.reminderDays != null) payload.reminderDays = patch.reminderDays;
    if (patch.category !== undefined) payload.category = patch.category ?? null;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.BILLS, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapBillDoc(id, snap.data() ?? payload);
  },

  deleteBill: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.BILLS, id));
  },

  fetchGoals: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.GOALS, userId, mapGoalDoc),

  addGoal: async (g: Goal) => {
    const firestore = requireDb();
    const payload = toGoalWrite(g);
    if (g.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.GOALS, g.id), payload);
      return mapGoalDoc(g.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.GOALS), payload);
    return mapGoalDoc(ref.id, payload);
  },

  updateGoal: async (id: string, userId: string, patch: Partial<Goal>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    const title = patch.title ?? patch.name;
    if (title != null) payload.title = title;
    if (patch.targetAmount != null) payload.targetAmount = Number(patch.targetAmount) || 0;
    if (patch.savedAmount != null || patch.currentAmount != null) {
      payload.savedAmount = Number(patch.savedAmount ?? patch.currentAmount) || 0;
    }
    if (patch.targetDate != null) payload.targetDate = patch.targetDate;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.GOALS, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapGoalDoc(id, snap.data() ?? payload);
  },

  deleteGoal: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.GOALS, id));
  },

  fetchRecurring: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.RECURRING, userId, mapRecurringDoc),

  addRecurring: async (r: RecurringTransaction) => {
    const firestore = requireDb();
    const payload = toRecurringWrite(r);
    if (r.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.RECURRING, r.id), payload);
      return mapRecurringDoc(r.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.RECURRING), payload);
    return mapRecurringDoc(ref.id, payload);
  },

  updateRecurring: async (id: string, userId: string, patch: Partial<RecurringTransaction>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.type != null) payload.type = patch.type === "income" ? "income" : "expense";
    if (patch.description != null) payload.description = patch.description;
    if (patch.category != null) payload.category = patch.category;
    if (patch.amount != null) payload.amount = Number(patch.amount) || 0;
    if (patch.recurrence != null) payload.recurrence = patch.recurrence;
    if (patch.startDate != null) payload.startDate = patch.startDate;
    if (patch.endDate !== undefined) payload.endDate = patch.endDate ?? null;
    if (patch.isActive != null) payload.isActive = patch.isActive !== false;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.RECURRING, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapRecurringDoc(id, snap.data() ?? payload);
  },

  deleteRecurring: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.RECURRING, id));
  },

  fetchCategories: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.CATEGORIES, userId, mapCategoryDoc),

  addCategory: async (c: Category) => {
    const firestore = requireDb();
    const payload = toCategoryWrite(c);
    if (c.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.CATEGORIES, c.id), payload);
      return mapCategoryDoc(c.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.CATEGORIES), payload);
    return mapCategoryDoc(ref.id, payload);
  },

  addCategoriesBulk: async (items: Array<Omit<Category, "id"> & { id?: string }>) => {
    const firestore = requireDb();
    if (!items.length) return [];
    const CHUNK = 400;
    const results: Category[] = [];
    for (let offset = 0; offset < items.length; offset += CHUNK) {
      const chunk = items.slice(offset, offset + CHUNK);
      const batch = writeBatch(firestore);
      for (const item of chunk) {
        const payload = toCategoryWrite({
          userId: item.userId,
          name: item.name,
          type: item.type,
          color: item.color,
          isDefault: item.isDefault,
          createdAt: item.createdAt,
        });
        const id = item.id || doc(collection(firestore, FIRESTORE_COLLECTIONS.CATEGORIES)).id;
        batch.set(doc(firestore, FIRESTORE_COLLECTIONS.CATEGORIES, id), payload);
        results.push(mapCategoryDoc(id, payload));
      }
      await batch.commit();
    }
    return results;
  },

  /** Seed defaults when the user has no categories yet. Returns existing if already seeded. */
  ensureDefaultCategories: async (userId: string) => {
    const existing = await listByUserId(FIRESTORE_COLLECTIONS.CATEGORIES, userId, mapCategoryDoc);
    if (existing.length > 0) return existing;
    const seeds = buildCategorySeedDocs(userId);
    return firestoreApi.addCategoriesBulk(seeds);
  },

  updateCategory: async (id: string, userId: string, patch: Partial<Category>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.name != null) payload.name = String(patch.name).trim().replace(/\s+/g, " ");
    if (patch.type != null) payload.type = patch.type === "income" ? "income" : "expense";
    if (patch.color != null) payload.color = resolveCategoryColor(patch.color);
    if (patch.isDefault != null) payload.isDefault = Boolean(patch.isDefault);
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.CATEGORIES, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapCategoryDoc(id, snap.data() ?? payload);
  },

  deleteCategory: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.CATEGORIES, id));
  },

  fetchRules: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.RULES, userId, mapRuleDoc),

  addRule: async (r: CategorizationRule) => {
    const firestore = requireDb();
    const payload = toRuleWrite(r);
    if (r.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.RULES, r.id), payload);
      return mapRuleDoc(r.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.RULES), payload);
    return mapRuleDoc(ref.id, payload);
  },

  updateRule: async (id: string, userId: string, patch: Partial<CategorizationRule>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.name != null) payload.name = patch.name;
    if (patch.matchContains != null) payload.matchContains = String(patch.matchContains).trim();
    if (patch.matchContainsAny != null) {
      payload.matchContainsAny = patch.matchContainsAny.map((s) => String(s ?? "").trim()).filter(Boolean);
      if (!payload.matchContains && payload.matchContainsAny[0]) {
        payload.matchContains = payload.matchContainsAny[0];
      }
    }
    if (patch.category != null) payload.category = patch.category;
    if (patch.paymentMode !== undefined) {
      if (patch.paymentMode) payload.paymentMode = patch.paymentMode;
      else payload.paymentMode = null;
    }
    if (patch.transactionType != null) payload.transactionType = patch.transactionType;
    if (patch.isActive != null) payload.isActive = patch.isActive !== false;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.RULES, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapRuleDoc(id, snap.data() ?? payload);
  },

  deleteRule: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.RULES, id));
  },

  fetchDebts: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.DEBTS, userId, mapDebtDoc),

  addDebt: async (d: Debt) => {
    const firestore = requireDb();
    const payload = toDebtWrite(d);
    if (d.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.DEBTS, d.id), payload);
      return mapDebtDoc(d.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.DEBTS), payload);
    return mapDebtDoc(ref.id, payload);
  },

  updateDebt: async (id: string, userId: string, patch: Partial<Debt>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.title != null) payload.title = patch.title;
    if (patch.kind != null) payload.kind = patch.kind;
    if (patch.principal != null) payload.principal = Number(patch.principal) || 0;
    if (patch.balance != null) payload.balance = Number(patch.balance) || 0;
    if (patch.interestRate != null) payload.interestRate = Number(patch.interestRate) || 0;
    if (patch.minimumPayment != null) payload.minimumPayment = Number(patch.minimumPayment) || 0;
    if (patch.dueDay !== undefined) payload.dueDay = patch.dueDay ?? null;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.DEBTS, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapDebtDoc(id, snap.data() ?? payload);
  },

  deleteDebt: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.DEBTS, id));
  },

  fetchNetWorthItems: (userId: string) => listByUserId(FIRESTORE_COLLECTIONS.NET_WORTH, userId, mapNetWorthDoc),

  addNetWorthItem: async (item: NetWorthItem) => {
    const firestore = requireDb();
    const payload = toNetWorthWrite(item);
    if (item.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.NET_WORTH, item.id), payload);
      return mapNetWorthDoc(item.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.NET_WORTH), payload);
    return mapNetWorthDoc(ref.id, payload);
  },

  updateNetWorthItem: async (id: string, userId: string, patch: Partial<NetWorthItem>) => {
    const firestore = requireDb();
    const payload: DocumentData = {
      userId,
      updatedAt: new Date().toISOString(),
    };
    if (patch.name != null) payload.name = patch.name;
    if (patch.kind != null) payload.kind = patch.kind;
    if (patch.balance != null) payload.balance = Number(patch.balance) || 0;
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.NET_WORTH, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapNetWorthDoc(id, snap.data() ?? payload);
  },

  deleteNetWorthItem: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.NET_WORTH, id));
  },

  fetchSplitParticipants: (userId: string) =>
    listByUserId(FIRESTORE_COLLECTIONS.SPLIT_PARTICIPANTS, userId, mapSplitParticipantDoc),

  addSplitParticipant: async (p: SplitParticipant) => {
    const firestore = requireDb();
    const payload = toSplitParticipantWrite(p);
    if (p.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.SPLIT_PARTICIPANTS, p.id), payload);
      return mapSplitParticipantDoc(p.id, { ...payload, userId: p.userId });
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.SPLIT_PARTICIPANTS), payload);
    return mapSplitParticipantDoc(ref.id, { ...payload, userId: p.userId });
  },

  deleteSplitParticipant: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.SPLIT_PARTICIPANTS, id));
  },

  fetchSplitExpenses: (userId: string) =>
    listByUserId(FIRESTORE_COLLECTIONS.SPLIT_EXPENSES, userId, mapSplitExpenseDoc),

  addSplitExpense: async (e: SplitExpense) => {
    const firestore = requireDb();
    const payload = toSplitExpenseWrite(e);
    if (e.id) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.SPLIT_EXPENSES, e.id), payload);
      return mapSplitExpenseDoc(e.id, payload);
    }
    const ref = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.SPLIT_EXPENSES), payload);
    return mapSplitExpenseDoc(ref.id, payload);
  },

  updateSplitExpense: async (id: string, userId: string, patch: Partial<SplitExpense>) => {
    const firestore = requireDb();
    const payload: DocumentData = { userId };
    if (patch.title != null) payload.title = patch.title;
    if (patch.amount != null) payload.amount = Number(patch.amount) || 0;
    if (patch.date != null) payload.date = normalizeTxDate(patch.date);
    if (patch.paidById != null) payload.paidById = patch.paidById;
    if (patch.participantIds != null) payload.participantIds = patch.participantIds;
    if (patch.transactionId !== undefined) payload.transactionId = patch.transactionId ?? null;
    if (patch.settled != null) payload.settled = Boolean(patch.settled);
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.SPLIT_EXPENSES, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return mapSplitExpenseDoc(id, snap.data() ?? payload);
  },

  deleteSplitExpense: async (id: string) => {
    const firestore = requireDb();
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.SPLIT_EXPENSES, id));
  },
};
