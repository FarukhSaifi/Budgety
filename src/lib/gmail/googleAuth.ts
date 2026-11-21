import { GMAIL_ENDPOINTS, GMAIL_ERROR_MESSAGES, GMAIL_SCOPES } from "@constants";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || GMAIL_ENDPOINTS.DEFAULT_REDIRECT_URI;

  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  return Boolean(clientId && clientSecret);
}

/**
 * Builds the consent screen URL for Gmail read-only access.
 */
export function buildGoogleAuthUrl(state?: string, redirectUriOverride?: string): string {
  const { clientId, redirectUri } = getGoogleOAuthCredentials();
  const targetRedirectUri = redirectUriOverride || redirectUri;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: targetRedirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES.READONLY,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  if (state) {
    params.set("state", state);
  }

  return `${GMAIL_ENDPOINTS.AUTH}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string, redirectUriOverride?: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthCredentials();
  const targetRedirectUri = redirectUriOverride || redirectUri;

  const response = await fetch(GMAIL_ENDPOINTS.TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: targetRedirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${GMAIL_ERROR_MESSAGES.OAUTH_EXCHANGE_FAILED}: ${response.status} ${errorText}`);
  }

  return (await response.json()) as GoogleTokens;
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const response = await fetch(GMAIL_ENDPOINTS.TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${GMAIL_ERROR_MESSAGES.TOKEN_REFRESH_FAILED}: ${response.status} ${errorText}`);
  }

  return (await response.json()) as GoogleTokens;
}
