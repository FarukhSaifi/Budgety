import { GMAIL_DEFAULTS, GMAIL_ERROR_MESSAGES } from "@constants";

import { refreshAccessToken } from "@/lib/gmail/googleAuth";
import { getStoredGmailAccount, saveGmailTokens, type StoredGmailAccount } from "@/lib/gmail/storage";

export class GmailAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "GmailAuthError";
    this.status = status;
  }
}

/**
 * Load the stored Gmail account and refresh the access token when expired.
 */
export async function resolveGmailAccessToken(
  userId: string,
): Promise<{ accessToken: string; account: StoredGmailAccount }> {
  const account = await getStoredGmailAccount(userId);
  if (!account?.refreshToken) {
    throw new GmailAuthError(GMAIL_ERROR_MESSAGES.ACCOUNT_NOT_CONNECTED);
  }

  let accessToken = account.accessToken || "";
  if (
    !accessToken ||
    !account.expiresAt ||
    Date.now() > account.expiresAt - GMAIL_DEFAULTS.TOKEN_REFRESH_EXPIRY_THRESHOLD_MS
  ) {
    try {
      const refreshed = await refreshAccessToken(account.refreshToken);
      accessToken = refreshed.access_token;
      await saveGmailTokens(userId, {
        refreshToken: account.refreshToken,
        accessToken: refreshed.access_token,
        expiresIn: refreshed.expires_in,
        email: account.email,
      });
    } catch {
      throw new GmailAuthError(GMAIL_ERROR_MESSAGES.TOKEN_REFRESH_RECONNECT);
    }
  }

  return { accessToken, account };
}
