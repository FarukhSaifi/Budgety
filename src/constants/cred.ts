/**
 * CRED (cred.club) Gmail sync — senders, queries, and UI copy.
 */

export const CRED_SENDERS = {
  /** Primary transactional sender for CC smart statements / bills. */
  PROTECT: "protect@cred.club",
  /** Domain catch-all (marketing + Kuvera, etc.). */
  DOMAIN: "cred.club",
} as const;

export const CRED_QUERIES = {
  /** Primary inbox search — bill / smart-statement mail. */
  PROTECT: `from:${CRED_SENDERS.PROTECT}`,
  /** Broader domain search (context / diagnostics only). */
  DOMAIN: `from:${CRED_SENDERS.DOMAIN}`,
} as const;

export const CRED_DEFAULTS = {
  /** Cap Cred messages fetched per sync (inbox is sparse vs bank alerts). */
  MAX_SEARCH_RESULTS: 100,
  /** Default reminder lead time for Cred-sourced bills. */
  BILL_REMINDER_DAYS: 3,
  /** Stable Bill.source value written to Firestore. */
  BILL_SOURCE: "cred",
  /** Bill.category label shown in UI. */
  BILL_CATEGORY: "Credit Card",
  /** Deterministic bill id prefix: cred_{bank}_{last4}_{YYYY-MM}. */
  BILL_ID_PREFIX: "cred",
} as const;

export const CRED_UI_TEXT = {
  SOURCE_BADGE: "CRED",
  SOURCE_LABEL: "From CRED",
  BILLS_SYNCED: "CRED bills synced",
  BILLS_SYNCED_COUNT: "{count} CRED bill(s) added/updated in Bills",
  BILLS_FOUND: "CRED bills",
  EMAILS_SCANNED: "CRED emails",
  SPEND_STAGED: "CRED spend alerts staged for review",
  CONNECTED_HINT: "Includes CRED Protect CC bills (protect@cred.club)",
} as const;

export const CRED_ERROR_MESSAGES = {
  PARSE_FAILED: "Couldn’t parse one CRED email. Other items were still synced.",
  SYNC_FAILED: "CRED Gmail sync failed for one or more messages.",
} as const;
