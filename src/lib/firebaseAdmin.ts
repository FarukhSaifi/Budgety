import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

import { FIREBASE_ADMIN_ENV } from "@constants/admin";

/**
 * Server-only Firebase Admin (Auth). Used by `/api/admin/*` routes.
 *
 * Credentials (pick one path):
 * 1. Service account: FIREBASE_ADMIN_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY
 * 2. Auth emulator: FIREBASE_AUTH_EMULATOR_HOST + NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *    (no service account required)
 */
function resolveProjectId(): string | undefined {
  return (
    process.env[FIREBASE_ADMIN_ENV.PROJECT_ID]?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    undefined
  );
}

function resolvePrivateKey(): string | undefined {
  const raw = process.env[FIREBASE_ADMIN_ENV.PRIVATE_KEY];
  if (!raw?.trim()) return undefined;
  // Vercel / .env often store newlines as literal `\n`.
  return raw.replace(/\\n/g, "\n");
}

function isAdminConfigured(): boolean {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim()) {
    return Boolean(resolveProjectId());
  }
  return Boolean(
    resolveProjectId() &&
      process.env[FIREBASE_ADMIN_ENV.CLIENT_EMAIL]?.trim() &&
      resolvePrivateKey(),
  );
}

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  if (!isAdminConfigured()) {
    throw new Error("FIREBASE_ADMIN_NOT_CONFIGURED");
  }

  const projectId = resolveProjectId()!;
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.trim();

  if (emulatorHost) {
    adminApp = initializeApp({ projectId });
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env[FIREBASE_ADMIN_ENV.CLIENT_EMAIL]!.trim(),
      privateKey: resolvePrivateKey()!,
    }),
    projectId,
  });
  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function isFirebaseAdminConfigured(): boolean {
  try {
    return isAdminConfigured();
  } catch {
    return false;
  }
}
