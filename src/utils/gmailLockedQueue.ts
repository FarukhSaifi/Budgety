import { GMAIL_DEFAULTS, GMAIL_UI_TEXT } from "@constants";

import type { GmailLockedAttachment } from "@/types/gmail";

import { backfillLockedAttachmentMeta, detectBankLabel } from "@/lib/gmail/lockedAttachmentMeta";

function storageKey(userId: string): string {
  return `${GMAIL_DEFAULTS.LOCKED_QUEUE_STORAGE_PREFIX}${userId}`;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notifyQueueChanged(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  window.dispatchEvent(
    new CustomEvent(GMAIL_DEFAULTS.LOCKED_QUEUE_CHANGED_EVENT, { detail: { userId } }),
  );
}

function isFallbackBankLabel(label?: string): boolean {
  return !label || label === GMAIL_UI_TEXT.IMPORT_GMAIL_BANK_LABEL_FALLBACK;
}

function isFallbackPasswordHint(hint?: string): boolean {
  return !hint || hint === GMAIL_UI_TEXT.IMPORT_GMAIL_PASSWORD_HINT_FALLBACK;
}

function preferBankLabel(primary?: string, secondary?: string): string | undefined {
  if (primary && !isFallbackBankLabel(primary)) return primary;
  if (secondary && !isFallbackBankLabel(secondary)) return secondary;
  return primary || secondary;
}

function preferPasswordHint(primary?: string, secondary?: string): string | undefined {
  if (primary && !isFallbackPasswordHint(primary)) return primary;
  if (secondary && !isFallbackPasswordHint(secondary)) return secondary;
  return primary || secondary;
}

function metaRichness(item: GmailLockedAttachment): number {
  return (
    (item.bankLabel && !isFallbackBankLabel(item.bankLabel) ? 2 : item.bankLabel ? 1 : 0) +
    (item.passwordHint && !isFallbackPasswordHint(item.passwordHint) ? 3 : item.passwordHint ? 1 : 0) +
    (item.subject ? 1 : 0) +
    (item.from ? 2 : 0)
  );
}

/** Prefer the copy with richer unlock hints when merging the same id. */
function preferRicher(
  existing: GmailLockedAttachment | undefined,
  incoming: GmailLockedAttachment,
): GmailLockedAttachment {
  if (!existing) return incoming;
  const richerFirst = metaRichness(incoming) >= metaRichness(existing);
  const primary = richerFirst ? incoming : existing;
  const secondary = richerFirst ? existing : incoming;
  return {
    ...secondary,
    ...primary,
    bankLabel: preferBankLabel(primary.bankLabel, secondary.bankLabel),
    passwordHint: preferPasswordHint(primary.passwordHint, secondary.passwordHint),
    subject: primary.subject || secondary.subject,
    from: primary.from || secondary.from,
  };
}

/**
 * Copy from/subject/bank/hint across siblings that share a Gmail messageId.
 * Do not share by filename alone — banks often reuse generic names like
 * `statement.pdf`, which would cross-contaminate chips/hints across issuers.
 */
function propagateSharedLockedMeta(items: GmailLockedAttachment[]): GmailLockedAttachment[] {
  type SharedMeta = Pick<GmailLockedAttachment, "from" | "subject" | "bankLabel" | "passwordHint">;
  const byMessage = new Map<string, SharedMeta>();

  for (const item of items) {
    if (!item.messageId) continue;
    const prev = byMessage.get(item.messageId);
    byMessage.set(item.messageId, {
      from: item.from || prev?.from,
      subject: item.subject || prev?.subject,
      bankLabel: preferBankLabel(item.bankLabel, prev?.bankLabel),
      passwordHint: preferPasswordHint(item.passwordHint, prev?.passwordHint),
    });
  }

  return items.map((item) => {
    const shared = byMessage.get(item.messageId);
    const from = item.from || shared?.from;
    const subject = item.subject || shared?.subject;
    const detected =
      preferBankLabel(item.bankLabel, shared?.bankLabel) ||
      detectBankLabel({ from, subject, filename: item.filename });
    const passwordHint = preferPasswordHint(item.passwordHint, shared?.passwordHint);
    return backfillLockedAttachmentMeta({
      ...item,
      ...(from ? { from } : {}),
      ...(subject ? { subject } : {}),
      ...(detected ? { bankLabel: detected } : {}),
      ...(passwordHint ? { passwordHint } : {}),
    });
  });
}

export function readLockedQueue(userId: string): GmailLockedAttachment[] {
  if (!userId || !canUseSessionStorage()) return [];
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const validated = parsed.filter(isLockedAttachment);
    const items = propagateSharedLockedMeta(validated.map(backfillLockedAttachmentMeta));
    // Persist enrichment so bank/hint survive remounts without a new sync.
    const enriched = items.some((item, index) => {
      const prior = validated[index];
      return (
        !prior ||
        item.bankLabel !== prior.bankLabel ||
        item.passwordHint !== prior.passwordHint ||
        item.from !== prior.from ||
        item.subject !== prior.subject
      );
    });
    if (enriched) {
      try {
        sessionStorage.setItem(storageKey(userId), JSON.stringify(items));
      } catch {
        // Quota / private mode — still return in-memory enriched items.
      }
    }
    return items;
  } catch {
    return [];
  }
}

export function writeLockedQueue(userId: string, items: GmailLockedAttachment[]): void {
  if (!userId || !canUseSessionStorage()) return;
  try {
    if (items.length === 0) {
      sessionStorage.removeItem(storageKey(userId));
    } else {
      sessionStorage.setItem(storageKey(userId), JSON.stringify(items));
    }
    notifyQueueChanged(userId);
  } catch {
    // Quota / private mode — still notify so in-memory UI can re-read empty/partial state.
    notifyQueueChanged(userId);
  }
}

export function mergeLockedQueue(
  userId: string,
  incoming: GmailLockedAttachment[] | undefined | null,
): GmailLockedAttachment[] {
  const nextIncoming = (incoming ?? []).filter(isLockedAttachment).map(backfillLockedAttachmentMeta);
  if (nextIncoming.length === 0) return readLockedQueue(userId);

  const byId = new Map<string, GmailLockedAttachment>();
  for (const item of readLockedQueue(userId)) {
    byId.set(item.id, item);
  }
  for (const item of nextIncoming) {
    byId.set(item.id, preferRicher(byId.get(item.id), item));
  }
  const merged = propagateSharedLockedMeta([...byId.values()]);
  writeLockedQueue(userId, merged);
  return merged;
}

export function removeLockedItem(userId: string, id: string): GmailLockedAttachment[] {
  const next = readLockedQueue(userId).filter((item) => item.id !== id);
  writeLockedQueue(userId, next);
  return next;
}

export function clearLockedQueue(userId: string): void {
  writeLockedQueue(userId, []);
}

export function lockedAttachmentId(messageId: string, attachmentId: string): string {
  return `${messageId}:${attachmentId}`;
}

function isLockedAttachment(value: unknown): value is GmailLockedAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.messageId !== "string" ||
    typeof item.attachmentId !== "string" ||
    typeof item.filename !== "string" ||
    typeof item.mimeType !== "string"
  ) {
    return false;
  }
  // Optional hint fields must be strings when present (ignore corrupt values).
  for (const key of ["bankLabel", "passwordHint", "subject", "from"] as const) {
    if (item[key] !== undefined && typeof item[key] !== "string") return false;
  }
  return true;
}
