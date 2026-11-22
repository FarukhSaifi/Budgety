import { GMAIL_DEFAULTS, GMAIL_ENDPOINTS, GMAIL_ERROR_MESSAGES } from "@constants";

export interface GmailMessageSummary {
  id: string;
  threadId: string;
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  attachmentId: string;
  data?: Uint8Array;
}

export interface GmailFetchedMessage {
  id: string;
  threadId: string;
  internalDate: string;
  from: string;
  subject: string;
  date: string;
  bodyText: string;
  bodyHtml: string;
  snippet: string;
  attachments: GmailAttachment[];
}

interface GmailPart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailPart[];
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binaryString = atob(padded);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToString(base64Url: string): string {
  try {
    const bytes = base64UrlToUint8Array(base64Url);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Searches messages matching the query, following nextPageToken until maxResults.
 * Single-page fetches (old maxResults=35) truncated inboxes with dense UPI alerts.
 */
export async function searchGmailMessages(
  accessToken: string,
  query: string,
  maxResults: number = GMAIL_DEFAULTS.MAX_SEARCH_RESULTS,
): Promise<GmailMessageSummary[]> {
  const collected: GmailMessageSummary[] = [];
  let pageToken: string | undefined;
  const pageSize = Math.min(GMAIL_DEFAULTS.SEARCH_PAGE_SIZE, 500);

  while (collected.length < maxResults) {
    const url = new URL(`${GMAIL_ENDPOINTS.API_BASE}/messages`);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(Math.min(pageSize, maxResults - collected.length)));
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      // Do not include provider response bodies — they can leak into API 500s.
      throw new Error(GMAIL_ERROR_MESSAGES.SEARCH_FAILED);
    }

    const json = (await res.json()) as {
      messages?: GmailMessageSummary[];
      nextPageToken?: string;
    };

    const batch = json.messages || [];
    if (batch.length === 0) break;

    collected.push(...batch);
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return collected.slice(0, maxResults);
}

/**
 * Recursively parses MIME parts for text, HTML, and attachments.
 */
function walkParts(
  part: GmailPart,
  result: {
    bodyText: string[];
    bodyHtml: string[];
    attachments: GmailAttachment[];
  },
) {
  const mimeType = (part.mimeType || "").toLowerCase();
  const filename = part.filename || "";

  // Some bank MIME parts expose attachmentId with empty filename but application/pdf.
  // Dropping those silently missed statement PDFs.
  const looksLikeFile =
    Boolean(filename) ||
    mimeType.includes("pdf") ||
    mimeType.includes("csv") ||
    mimeType === "application/octet-stream";

  if (part.body?.attachmentId && looksLikeFile) {
    const fallbackName = mimeType.includes("pdf")
      ? GMAIL_DEFAULTS.FALLBACK_PDF_FILENAME
      : mimeType.includes("csv")
        ? GMAIL_DEFAULTS.FALLBACK_CSV_FILENAME
        : GMAIL_DEFAULTS.FALLBACK_ATTACHMENT_FILENAME;
    result.attachments.push({
      filename: filename || fallbackName,
      mimeType,
      attachmentId: part.body.attachmentId,
    });
  } else if (part.body?.data) {
    const decoded = base64UrlToString(part.body.data);
    if (mimeType === "text/plain") {
      result.bodyText.push(decoded);
    } else if (mimeType === "text/html") {
      result.bodyHtml.push(decoded);
    }
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      walkParts(subPart, result);
    }
  }
}

/**
 * Gets message details including headers, body, and attachment metadata.
 */
export async function getGmailMessage(accessToken: string, messageId: string): Promise<GmailFetchedMessage> {
  const url = `${GMAIL_ENDPOINTS.API_BASE}/messages/${encodeURIComponent(messageId)}?format=full`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(GMAIL_ERROR_MESSAGES.MESSAGE_FETCH_FAILED);
  }

  const data = (await res.json()) as GmailMessageDetail;
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const partsResult = {
    bodyText: [] as string[],
    bodyHtml: [] as string[],
    attachments: [] as GmailAttachment[],
  };

  if (data.payload) {
    walkParts(data.payload, partsResult);
  }

  return {
    id: data.id,
    threadId: data.threadId,
    internalDate: data.internalDate || "",
    snippet: data.snippet || "",
    from: getHeader("From"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    bodyText: partsResult.bodyText.join("\n"),
    bodyHtml: partsResult.bodyHtml.join("\n"),
    attachments: partsResult.attachments,
  };
}

/**
 * Downloads binary attachment data.
 */
export async function downloadGmailAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string,
): Promise<Uint8Array> {
  const url = `${GMAIL_ENDPOINTS.API_BASE}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(GMAIL_ERROR_MESSAGES.ATTACHMENT_DOWNLOAD_FAILED);
  }

  const json = (await res.json()) as { data?: string };
  if (!json.data) {
    throw new Error(GMAIL_ERROR_MESSAGES.ATTACHMENT_EMPTY);
  }

  return base64UrlToUint8Array(json.data);
}
