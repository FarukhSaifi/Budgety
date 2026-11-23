import {
  GMAIL_ENDPOINTS,
  GMAIL_ERROR_MESSAGES,
  GMAIL_OAUTH_LOOPBACK_HOST_HEADER_PATTERN,
  GMAIL_OAUTH_LOOPBACK_HOSTNAMES,
  GMAIL_SCOPES,
} from "@constants";

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

function isLoopbackHostname(hostname: string): boolean {
  // WHATWG URL.hostname may return IPv6 with brackets (`[::1]`); allowlist stores bare `::1`.
  const normalized = hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  return (GMAIL_OAUTH_LOOPBACK_HOSTNAMES as readonly string[]).includes(normalized);
}

/** True when Host / X-Forwarded-Host is an exact loopback authority (no userinfo). */
function isSafeLoopbackHostHeader(hostHeader: string): boolean {
  return GMAIL_OAUTH_LOOPBACK_HOST_HEADER_PATTERN.test(hostHeader.trim());
}

/**
 * Parses an OAuth redirect URI and rejects userinfo / non-http(s) shapes that can
 * turn `http://localhost:3000@evil.com/...` into an open redirect via URL.origin.
 */
export function parseSafeOAuthRedirectUri(uri: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_REDIRECT_URI_REQUIRED);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_REDIRECT_URI_REQUIRED);
  }
  if (parsed.username || parsed.password) {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_REDIRECT_URI_REQUIRED);
  }
  return parsed;
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
  const isLocalHost = isSafeLoopbackHostHeader(host);

  if (envUri) {
    // Validate shape (no userinfo / non-http) but return the exact registered string.
    const parsedEnv = parseSafeOAuthRedirectUri(envUri);
    const envIsLocal = isLoopbackHostname(parsedEnv.hostname);
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
  const candidate = `${proto}://${host}/api/auth/gmail/callback`;
  const parsed = parseSafeOAuthRedirectUri(candidate);
  if (!isLoopbackHostname(parsed.hostname)) {
    throw new Error(GMAIL_ERROR_MESSAGES.OAUTH_REDIRECT_URI_REQUIRED);
  }
  return `${parsed.origin}/api/auth/gmail/callback`;
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
