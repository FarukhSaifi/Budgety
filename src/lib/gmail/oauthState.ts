import { createHmac, timingSafeEqual } from "crypto";

import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";

import { getGoogleOAuthCredentials } from "@/lib/gmail/googleAuth";

function stateSecret(): string {
  const fromEnv = process.env.GMAIL_OAUTH_STATE_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const { clientSecret } = getGoogleOAuthCredentials();
  return clientSecret || "budgety-oauth-state-dev";
}

function sign(payload: string): string {
  return createHmac("sha256", stateSecret()).update(payload).digest("base64url");
}

/** Signed OAuth `state` binding the Budgety uid (HMAC + expiry). */
export function createOAuthState(userId: string): string {
  const uid = userId.trim();
  if (!uid || uid === GMAIL_DEFAULTS.DEFAULT_USER_ID) {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_USER_REQUIRED);
  }
  const exp = String(Date.now() + GMAIL_DEFAULTS.OAUTH_STATE_TTL_MS);
  const payload = `${uid}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify and extract uid from OAuth `state`. Returns null if invalid/expired. */
export function verifyOAuthState(state: string | null | undefined): string | null {
  if (!state) return null;
  const parts = state.split(".");
  if (parts.length !== 3) return null;

  const [uid, exp, signature] = parts;
  if (!uid || !exp || !signature) return null;

  const payload = `${uid}.${exp}`;
  const expected = sign(payload);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return uid;
}
