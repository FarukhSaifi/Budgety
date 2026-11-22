"use client";

import { GMAIL_ERROR_MESSAGES } from "@constants";

import { auth } from "@/lib/firebase";

/**
 * Authenticated fetch for user-scoped `/api/*` routes.
 * Attaches the current user's Firebase ID token as Bearer auth.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error(GMAIL_ERROR_MESSAGES.UNAUTHORIZED);
  }

  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${idToken}`);

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
