import { GMAIL_ENDPOINTS } from "@constants";

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
 * Searches messages matching the query.
 */
export async function searchGmailMessages(
  accessToken: string,
  query: string,
  maxResults = 30,
): Promise<GmailMessageSummary[]> {
  const url = new URL(`${GMAIL_ENDPOINTS.API_BASE}/messages`);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(Math.min(maxResults, 100)));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${err}`);
  }

  const json = (await res.json()) as { messages?: GmailMessageSummary[] };
  return json.messages || [];
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

  if (part.body?.attachmentId && filename) {
    result.attachments.push({
      filename,
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
  const url = `${GMAIL_ENDPOINTS.API_BASE}/messages/${messageId}?format=full`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get Gmail message ${messageId}: ${res.status} ${err}`);
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
  const url = `${GMAIL_ENDPOINTS.API_BASE}/messages/${messageId}/attachments/${attachmentId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to download attachment ${attachmentId}: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { data?: string };
  if (!json.data) {
    throw new Error("Empty attachment data received from Gmail API");
  }

  return base64UrlToUint8Array(json.data);
}
