import { FIRESTORE_COLLECTIONS } from "@constants/firestore";
import { GMAIL_DEFAULTS } from "@constants/gmail";

import type { GmailConnectionStatus } from "@/types/gmail";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

export interface StoredGmailAccount {
  userId: string;
  email: string | null;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
  lastSyncAt?: string;
  autoSyncEnabled?: boolean;
  autoSyncIntervalHours?: number;
  updatedAt: string;
}

// In-memory fallback for local dev when Firebase Admin is not configured with service account
const localMemoryStore = new Map<string, StoredGmailAccount>();

const COLLECTION_NAME = FIRESTORE_COLLECTIONS.GMAIL_INTEGRATIONS;

export async function saveGmailTokens(
  userId: string,
  data: {
    refreshToken: string;
    accessToken?: string;
    expiresIn?: number;
    email?: string | null;
    autoSyncEnabled?: boolean;
    autoSyncIntervalHours?: number;
  },
): Promise<void> {
  const expiresAt = data.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined;
  const existing = localMemoryStore.get(userId);

  const payload: StoredGmailAccount = {
    userId,
    email: data.email || existing?.email || null,
    refreshToken: data.refreshToken,
    accessToken: data.accessToken,
    expiresAt,
    autoSyncEnabled: data.autoSyncEnabled ?? existing?.autoSyncEnabled ?? true,
    autoSyncIntervalHours:
      data.autoSyncIntervalHours ?? existing?.autoSyncIntervalHours ?? GMAIL_DEFAULTS.AUTO_SYNC_INTERVAL_HOURS,
    updatedAt: new Date().toISOString(),
  };

  localMemoryStore.set(userId, payload);

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTION_NAME).doc(userId).set(payload, { merge: true });
    } catch {
      // Safe fallback to in-memory store in local development
    }
  }
}

export async function getStoredGmailAccount(
  userId: string,
): Promise<StoredGmailAccount | null> {
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection(COLLECTION_NAME).doc(userId).get();
      if (snap.exists) {
        return snap.data() as StoredGmailAccount;
      }
    } catch {
      // Safe fallback to in-memory store in local development
    }
  }

  return localMemoryStore.get(userId) || null;
}

export async function updateAutoSyncSettings(
  userId: string,
  settings: { autoSyncEnabled?: boolean; autoSyncIntervalHours?: number },
): Promise<void> {
  const existing = localMemoryStore.get(userId);
  if (existing) {
    if (settings.autoSyncEnabled !== undefined) {
      existing.autoSyncEnabled = settings.autoSyncEnabled;
    }
    if (settings.autoSyncIntervalHours !== undefined) {
      existing.autoSyncIntervalHours = settings.autoSyncIntervalHours;
    }
    existing.updatedAt = new Date().toISOString();
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTION_NAME).doc(userId).set(settings, { merge: true });
    } catch {
      // Safe fallback
    }
  }
}

export async function updateLastSync(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = localMemoryStore.get(userId);
  if (existing) {
    existing.lastSyncAt = now;
  }

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTION_NAME).doc(userId).set({ lastSyncAt: now }, { merge: true });
    } catch {
      // Safe fallback
    }
  }
}

export async function removeGmailAccount(userId: string): Promise<void> {
  localMemoryStore.delete(userId);

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      await db.collection(COLLECTION_NAME).doc(userId).delete();
    } catch {
      // Safe fallback
    }
  }
}

export async function getGmailStatus(userId: string): Promise<GmailConnectionStatus> {
  const acc = await getStoredGmailAccount(userId);
  if (!acc || !acc.refreshToken) {
    return { connected: false };
  }
  return {
    connected: true,
    email: acc.email,
    lastSyncAt: acc.lastSyncAt || null,
    expiresAt: acc.expiresAt || null,
    autoSyncEnabled: acc.autoSyncEnabled ?? true,
    autoSyncIntervalHours: acc.autoSyncIntervalHours ?? GMAIL_DEFAULTS.AUTO_SYNC_INTERVAL_HOURS,
  };
}
