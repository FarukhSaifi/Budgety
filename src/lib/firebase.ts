"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Required env vars (NEXT_PUBLIC_* — safe for the browser):
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * Optional: NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST (e.g. 127.0.0.1:9099)
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/**
 * On non-Firebase hosts (e.g. Vercel), use the page hostname as authDomain so
 * Auth helper iframes are same-origin. Pair with next.config.js rewrite of
 * `/__/auth/*` → `https://<project>.firebaseapp.com/__/auth/*`.
 * Localhost keeps the configured `*.firebaseapp.com` domain (popup works there).
 */
function resolveAuthDomain(): string | undefined {
  const configured = firebaseConfig.authDomain;
  if (typeof window === "undefined") return configured;
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return configured;
  return hostname;
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (isFirebaseConfigured) {
  const clientConfig = {
    ...firebaseConfig,
    authDomain: resolveAuthDomain(),
  };
  app = getApps().length ? getApp() : initializeApp(clientConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (typeof window !== "undefined" && emulatorHost && !auth.emulatorConfig) {
    const url = emulatorHost.startsWith("http")
      ? emulatorHost
      : `http://${emulatorHost}`;
    connectAuthEmulator(auth, url, { disableWarnings: true });
  }
} else {
  // Placeholder so imports don't crash during SSR without env; AuthGuard shows config error.
  app = undefined as unknown as FirebaseApp;
  auth = undefined as unknown as Auth;
  db = undefined as unknown as Firestore;
}

/** Shared Google provider instance (Phase 1 — Firebase Auth Google sign-in). */
export const googleProvider = new GoogleAuthProvider();

export { app, auth, db };
