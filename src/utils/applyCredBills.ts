/**
 * Upsert CRED bill drafts into Firestore via the bills slice API.
 * Uses deterministic ids so re-sync updates amount/due instead of duplicating.
 */

import { CRED_DEFAULTS, CRED_UI_TEXT } from "@constants";

import { nowISO } from "@utils/dateUtils";

import { firestoreApi } from "@/lib/firestore";
import type { CredBillDraft } from "@/lib/gmail/credParser.types";
import type { Bill } from "@/types";

export interface ApplyCredBillsResult {
  upserted: number;
  skippedPaid: number;
}

/**
 * Create or update Bills from CRED sync drafts.
 * Skips overwriting bills the user already marked paid for that id.
 */
export async function applyCredBills(
  userId: string,
  drafts: CredBillDraft[],
  existingBills?: Bill[],
): Promise<ApplyCredBillsResult> {
  if (!userId || drafts.length === 0) {
    return { upserted: 0, skippedPaid: 0 };
  }

  const byId = new Map((existingBills || []).map((b) => [b.id, b]));
  let upserted = 0;
  let skippedPaid = 0;

  for (const draft of drafts) {
    const existing = byId.get(draft.id);
    if (existing && (existing.isPaid || existing.status === "paid")) {
      skippedPaid++;
      continue;
    }

    const bill: Bill = {
      id: draft.id,
      userId,
      title: draft.title,
      name: draft.title,
      amount: draft.amount,
      dueDate: draft.dueDate,
      recurrence: draft.recurrence,
      status: draft.status,
      isPaid: false,
      paidDate: null,
      isRecurring: draft.isRecurring,
      reminderDays: draft.reminderDays,
      category: draft.category || CRED_DEFAULTS.BILL_CATEGORY,
      source: draft.source || CRED_DEFAULTS.BILL_SOURCE,
      createdAt: existing?.createdAt || nowISO(),
    };

    await firestoreApi.addBill(bill);
    upserted++;
  }

  return { upserted, skippedPaid };
}

export function credBillsToastMessage(upserted: number): string {
  return CRED_UI_TEXT.BILLS_SYNCED_COUNT.replace("{count}", String(upserted));
}
