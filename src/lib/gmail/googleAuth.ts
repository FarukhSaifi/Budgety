import { GMAIL_ENDPOINTS, GMAIL_ERROR_MESSAGES, GMAIL_OAUTH_LOOPBACK_HOSTNAMES, GMAIL_SCOPES } from "@constants";

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

/** Parse hostname from a Host / X-Forwarded-Host value (supports `[::1]:port`). */
function hostnameFromHostHeader(hostHeader: string): string {
  const trimmed = hostHeader.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end > 1) return trimmed.slice(1, end);
  }
  return trimmed.split(":")[0] || "";
}

function isLoopbackHostname(hostname: string): boolean {
  return (GMAIL_OAUTH_LOOPBACK_HOSTNAMES as readonly string[]).includes(hostname);
}

/**
 * Resolves the OAuth redirect URI for the incoming request.
 * Prefers GOOGLE_REDIRECT_URI when set (required in production).
 * Derives from Host headers only for exact loopback hostnames — never trust
 * forwarded Host on non-local requests (open redirect / token theft risk).
 */
export function resolveRedirectUri(request: Request): string {
  const envUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const host = hostHeader.split(",")[0]?.trim() || "localhost:3000";
  const isLocalHost = isLoopbackHostname(hostnameFromHostHeader(host));

  if (envUri) {
    const envIsLocal = /:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(envUri);
    if (!envIsLocal || isLocalHost) {
      return envUri;
    }
  }

  if (!isLocalHost) {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_REDIRECT_URI_REQUIRED);
  }

  // Only allow http/https on loopback-derived URIs (never echo arbitrary X-Forwarded-Proto).
  const rawProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const proto = rawProto === "https" ? "https" : "http";
  return `${proto}://${host}/api/auth/gmail/callback`;
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
    // Never attach provider response bodies — they can surface in redirects/logs.
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_EXCHANGE_FAILED);
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
    throw new Error(GMAIL_ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
  }

  return (await response.json()) as GoogleTokens;
}
