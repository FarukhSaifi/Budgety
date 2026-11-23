import { ERROR_MESSAGES } from "@constants";

export interface SafeApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

function errorFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("error" in data)) return null;
  const value = (data as { error?: unknown }).error;
  return typeof value === "string" && value.trim() ? value : null;
}

function httpStatusFallback(status: number, fallbackError: string): string {
  if (status === 404) return ERROR_MESSAGES.API_NOT_FOUND;
  if (status === 503) return ERROR_MESSAGES.API_SERVICE_UNAVAILABLE;
  if (status === 502 || status === 504) {
    return ERROR_MESSAGES.API_GATEWAY_ERROR.replace("{status}", String(status));
  }
  if (status === 500) return ERROR_MESSAGES.API_INTERNAL_ERROR;
  return ERROR_MESSAGES.API_STATUS_FAILED.replace("{fallback}", fallbackError).replace("{status}", String(status));
}

/**
 * Safely parses a fetch Response as JSON without throwing `Unexpected end of JSON input`.
 * Handles empty bodies, HTML error pages, and custom JSON `{ error: "..." }` payloads.
 */
export async function safeParseJsonResponse<T>(
  res: Response,
  fallbackError: string = ERROR_MESSAGES.REQUEST_FAILED,
): Promise<SafeApiResponse<T>> {
  const text = await res.text().catch(() => "");
  let data: T | null = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // Non-JSON response (e.g. Vercel empty 500, gateway timeout HTML, etc.)
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data,
      error: errorFromPayload(data) || httpStatusFallback(res.status, fallbackError),
    };
  }

  return { ok: true, status: res.status, data, error: null };
}
