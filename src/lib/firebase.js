"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

/**
 * Firebase client configuration.
 *
 * All values are public (safe to expose to the browser) and come from
 * NEXT_PUBLIC_FIREBASE_* environment variables. See `.env.example` and
 * `docs/AUTH_SETUP.md` for how to obtain them from the Firebase console.
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

// Reuse the existing app during Next.js fast refresh / repeated imports.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Connect to the local Auth emulator when configured (dev/testing without a
// real Firebase project). Guard so it only runs once in the browser.
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (typeof window !== "undefined" && emulatorHost && !auth.emulatorConfig) {
  const url = emulatorHost.startsWith("http") ? emulatorHost : `http://${emulatorHost}`;
  connectAuthEmulator(auth, url, { disableWarnings: true });
}

export { app };
