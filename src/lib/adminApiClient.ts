"use client";

import { auth } from "@/lib/firebase";

/**
 * Authenticated fetch for `/api/admin/*`.
 * Attaches the current user's Firebase ID token as Bearer auth.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ADMIN_UNAUTHORIZED");
  }

  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
