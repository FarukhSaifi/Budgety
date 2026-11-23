/**
 * Constants for Gmail integration, OAuth 2.0 endpoints, API limits, and UI strings.
 */

export const GMAIL_ENDPOINTS = {
  AUTH: "https://accounts.google.com/o/oauth2/v2/auth",
  TOKEN: "https://oauth2.googleapis.com/token",
  USERINFO: "https://www.googleapis.com/oauth2/v2/userinfo",
  API_BASE: "https://gmail.googleapis.com/gmail/v1/users/me",
  DEFAULT_REDIRECT_URI: "http://localhost:3000/api/auth/gmail/callback",
} as const;

/** Exact hostnames allowed for Host-header-derived OAuth redirect URIs (never use startsWith). */
export const GMAIL_OAUTH_LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "::1"] as const;

/**
 * Strict Host / X-Forwarded-Host shapes for local OAuth redirect derivation.
 * Rejects userinfo tricks like `localhost:3000@evil.com` that bypass hostname allowlists.
 */
export const GMAIL_OAUTH_LOOPBACK_HOST_HEADER_PATTERN = /^(localhost|127\.0\.0\.1)(:\d+)?$|^\[::1\](:\d+)?$/i;

export const GMAIL_SCOPES = {
  READONLY: "https://www.googleapis.com/auth/gmail.readonly",
} as const;

export const GMAIL_DATE_RANGE_MODES = {
  PRESET: "preset",
  CUSTOM: "custom",
} as const;

export const GMAIL_DATE_PRESETS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 14 days", value: 14 },
  { label: "Last 30 days (Recommended)", value: 30 },
  { label: "Last 45 days", value: 45 },
  { label: "Last 60 days", value: 60 },
  { label: "Last 90 days (Quarter)", value: 90 },
  { label: "Last 180 days (6 Months)", value: 180 },
  { label: "Last 365 days (1 Year)", value: 365 },
] as const;

export const GMAIL_AUTO_SYNC_INTERVALS = [
  { label: "Every 6 hours", hours: 6 },
  { label: "Every 12 hours (Twice daily)", hours: 12 },
  { label: "Every 24 hours (Daily, Recommended)", hours: 24 },
  { label: "Every 48 hours (Every 2 days)", hours: 48 },
] as const;

export const GMAIL_DEFAULTS = {
  /**
   * Manual sync default. 30 days covers the current statement cycle.
   */
  DAYS_BACK: 30,
  /**
   * Cap on messages fetched per sync. Was 35 — daily UPI/CC alerts alone exceed that
   * in ~2 weeks and silently dropped e-statement PDFs past maxResults.
   * Gmail list API returns ≤500/page; client paginates up to this cap.
   */
  MAX_SEARCH_RESULTS: 150,
  /** Gmail list API page size (API max 500). */
  SEARCH_PAGE_SIZE: 100,
  /**
   * Gmail sync / unlock route `maxDuration`.
   * Next.js segment config requires a numeric literal in the route file — keep
   * `export const maxDuration = 120` in those routes equal to this value.
   */
  MAX_DURATION_SECONDS: 120,
  TOKEN_REFRESH_EXPIRY_THRESHOLD_MS: 60_000,
  /** Signed OAuth `state` lifetime (HMAC payload expiry). */
  OAUTH_STATE_TTL_MS: 10 * 60 * 1000,
  DEFAULT_USER_ID: "default_user",
  AUTO_SYNC_INTERVAL_HOURS: 24,
  /**
   * Auto-sync lookback. Match DAYS_BACK so overnight catch-up still sees
   * last month’s CC/bank e-statement if the user was offline mid-cycle.
   */
  AUTO_SYNC_DAYS_BACK: 30,
  /** Max Gmail messages processed in parallel during sync. */
  SYNC_MESSAGE_CONCURRENCY: 4,
  /** Max controlled auto-sync retries after a soft failure. */
  AUTO_SYNC_MAX_RETRIES: 1,
  /** Delay before a controlled auto-sync retry. */
  AUTO_SYNC_RETRY_DELAY_MS: 1_500,
  LOCKED_QUEUE_STORAGE_PREFIX: "budgety.gmail.lockedAttachments.",
  /** Same-tab event so Import Review refreshes when auto-sync queues locked PDFs. */
  LOCKED_QUEUE_CHANGED_EVENT: "budgety:gmail-locked-queue-changed",
  /** Session handoff for unlocked txs → Import Review (auto-sync / cross-route). */
  REVIEW_QUEUE_STORAGE_PREFIX: "budgety.gmail.reviewStaging.",
  /** Same-tab event so Import Review hydrates when auto-sync stages transactions. */
  REVIEW_QUEUE_CHANGED_EVENT: "budgety:gmail-review-queue-changed",
  SESSION_SYNC_KEY_PREFIX: "gmail_auto_synced_",
  /** Browser event names used for Import Review queue hydration. */
  WINDOW_FOCUS_EVENT: "focus",
  DOCUMENT_VISIBILITY_EVENT: "visibilitychange",
  DOCUMENT_VISIBLE_STATE: "visible",
  /** Fallback names when MIME parts omit filename but look like files. */
  FALLBACK_PDF_FILENAME: "statement.pdf",
  FALLBACK_CSV_FILENAME: "statement.csv",
  FALLBACK_ATTACHMENT_FILENAME: "attachment",
  /** Max chars scanned in email body when inferring PDF password-format hints. */
  PASSWORD_HINT_SCAN_CHARS: 8_000,
  /** Minimum plain-body length before showing a generic password-format fallback hint. */
  PASSWORD_HINT_FALLBACK_BODY_MIN: 40,
  /** Minimum snippet length before showing a generic password-format fallback hint. */
  PASSWORD_HINT_FALLBACK_SNIPPET_MIN: 20,
  /** Minimum token length for bank-label word matching in subjects/filenames. */
  BANK_LABEL_MIN_TOKEN_LENGTH: 2,
} as const;

export const GMAIL_UI_TEXT = {
  TITLE: "Gmail Statement & Alert Auto-Sync",
  SECTION_AUTOMATION: "Automate from Gmail",
  SECTION_AUTOMATION_HINT:
    "Connect once — fetch bank & credit-card statements and transaction alerts. Results land in the same review table as a manual upload.",
  SECTION_MANUAL: "Or upload a file manually",
  SECTION_MANUAL_HINT: "Drag a PDF, CSV, or Excel statement anytime. Manual import always stays available.",
  CONNECTED: "Connected",
  NOT_CONNECTED: "Not Connected",
  CONNECTED_SUBTITLE:
    "Syncing from {email} (HDFC, ICICI, SBI, Axis, Kotak, Amex, OneCard, CRED Protect & other Indian banks/CC)",
  DISCONNECTED_SUBTITLE: "Automatically fetch bank statements and transaction alerts directly from your Gmail inbox.",
  LAST_SYNCED: "Last synced: {time}",
  CHECKING: "Checking...",
  SCANNING: "Scanning Gmail...",
  SYNC_PROGRESS_SEARCHING: "Searching inbox…",
  SYNC_PROGRESS_DOWNLOADING: "Downloading messages…",
  SYNC_PROGRESS_PARSING: "Parsing statements & alerts…",
  SYNC_PROGRESS_DEDUPING: "Deduplicating transactions…",
  SYNC_PROGRESS_DONE: "Sync complete",
  SYNC_PROGRESS_ARIA: "Gmail sync progress",
  AUTO_SYNC_PROGRESS_ARIA: "Gmail auto-sync progress",
  SYNC_BUTTON: "Sync from Gmail",
  CONNECT_BUTTON: "Connect Gmail",
  DISCONNECT_BUTTON: "Disconnect Gmail Integration",
  SHOW_OPTIONS: "Sync Options",
  HIDE_OPTIONS: "Hide Options",
  TIME_WINDOW: "Time Window",
  DATE_RANGE_TYPE: "Date Range Mode",
  DATE_RANGE_PRESET: "Presets",
  DATE_RANGE_CUSTOM: "Custom Date Range",
  START_DATE: "From (Start Date)",
  END_DATE: "To (End Date)",
  AUTO_SYNC_TITLE: "Auto-Sync Settings",
  AUTO_SYNC_ENABLE: "Auto-sync on app open",
  AUTO_SYNC_INTERVAL: "Sync Frequency",
  AUTO_SYNC_ACTIVE: "Auto-Sync Enabled",
  AUTO_SYNC_RUNNING: "Running background auto-sync...",
  AUTO_SYNC_SUCCESS: "{count} transactions ready to review",
  AUTO_SYNC_PARTIAL: "{count} transaction(s) ready to review. {locked} password-locked statement(s) still need unlock.",
  AUTO_SYNC_LOCKED_ONLY: "{locked} password-locked statement(s) from Gmail need a password — open Import to unlock.",
  AUTO_SYNC_FAILED: "Gmail auto-sync couldn’t finish. You can sync manually from Import anytime.",
  AUTO_SYNC_ENABLED_TOAST: "Auto-sync enabled.",
  AUTO_SYNC_DISABLED_TOAST: "Auto-sync disabled.",
  DISCONNECTED_TOAST: "Gmail account disconnected.",
  CONNECTED_TOAST: "Gmail connected successfully{email}!",
  CONNECTION_FAILED_TOAST: "Gmail connection failed: {error}",
  SYNC_FOUND_STAGED: "Found {count} new transaction(s)! Added to staging for review.",
  SYNC_ALL_DUPLICATES: "All {count} transactions found are already imported. No new entries to stage.",
  SYNC_NONE_FOUND: "No bank statement emails found in the selected time window.",
  SYNC_LOCKED_NEED_PASSWORD: "{count} password-locked statement(s) need a password — unlock them in Review below.",
  OAUTH_NOT_CONFIGURED_HINT:
    "Google OAuth credentials are not set in .env.local. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Gmail sync.",
  PDF_PASSWORD: "PDF Statement Password",
  PDF_PASSWORD_PLACEHOLDER: "Optional (e.g. DOB/PAN)",
  PDF_PASSWORD_HINT: "Used if bank e-statements are password-locked",
  SOURCES: "Sources",
  SOURCE_ALERTS: "Instant transaction alerts",
  SOURCE_STATEMENTS: "e-Statement PDF attachments",
  SYNC_SUMMARY: "Sync Summary",
  NEW_TRANSACTIONS: "New transactions",
  NEW_TRANSACTIONS_COUNT: "{count} synced — ready to review below",
  EMAILS_SCANNED: "Emails Scanned",
  ALERTS_FOUND: "Alerts Found",
  STATEMENTS_FOUND: "Statements Found",
  CRED_BILLS_FOUND: "CRED bills",
  DUPLICATES_SKIPPED: "Duplicates Skipped",
  LOCKED_FOUND: "Password-locked",
  INTEGRATION_SETTINGS_TITLE: "Connected Services & Automations",
  QUICK_SET_THIS_MONTH: "This Month",
  QUICK_SET_LAST_MONTH: "Last Month",
  QUICK_SETS_LABEL: "Quick sets:",
  IMPORT_GMAIL_LOCKED_BODY:
    "This statement from Gmail is encrypted. Enter the bank password (often DOB or PAN) to unlock and add it to Review.",
  IMPORT_GMAIL_LOCKED_WAITING: "{count} locked statement(s) waiting",
  /** Includes unlocks and skips — advances the Gmail locked queue. */
  IMPORT_GMAIL_LOCKED_PROGRESS: "{unlocked} of {total} completed",
  IMPORT_GMAIL_LOCKED_PROGRESS_ARIA: "Gmail locked-statement queue progress",
  IMPORT_GMAIL_LOCKED_SKIP: "Skip this statement",
  IMPORT_GMAIL_FROM_LABEL: "From Gmail",
  /** When sender/subject/filename do not match a known bank. */
  IMPORT_GMAIL_BANK_LABEL_FALLBACK: "Bank",
  /** Prefix for inferred format guidance (never an actual password). */
  IMPORT_GMAIL_PASSWORD_HINT_LABEL: "Hint",
  IMPORT_GMAIL_PASSWORD_HINT_FALLBACK:
    "Banks often use DOB (DDMMYYYY) or PAN characters as the PDF password — check the statement email.",
  IMPORT_GMAIL_PASSWORD_HINT_WITH_EXAMPLE: "{hint} (e.g. {example})",
  IMPORT_GMAIL_LOCKED_QUEUE_ARIA: "Password-locked statements waiting to unlock",
} as const;

/**
 * Bank-specific password *format* defaults when the email body has no pattern match.
 * Format guidance only — never real passwords.
 */
export const BANK_PASSWORD_HINT_DEFAULTS: Record<string, { hint: string; example: string }> = {
  IndusInd: {
    hint: "IndusInd CC PDFs often use the first 4 letters of your name + DOB as DDMM",
    example: "JOHN1508",
  },
};

/**
 * Keyword/regex catalog for inferring PDF password *format* hints from statement emails.
 * Hints describe patterns only — never capture or store actual passwords.
 * Order matters: more specific patterns first.
 */
export const PDF_PASSWORD_HINT_PATTERNS = [
  {
    id: "name_plus_dob_ddmm",
    matchers: [
      /(?:first\s*[45].{0,40}(?:letters?|characters?).{0,40}(?:name|cardholder)).{0,80}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob|dd\s*mm)/i,
      /(?:name|cardholder).{0,40}(?:first\s*[45]).{0,80}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob|ddmm)/i,
      /indusind.{0,200}(?:password|passcode).{0,120}(?:name|dob|date\s*of\s*birth)/i,
    ],
    hint: "Password often combines the first 4 letters of your name with DOB as DDMM",
    example: "JOHN1508",
  },
  {
    id: "pan_plus_dob",
    matchers: [
      /(?:first\s*[45].{0,30}(?:PAN|permanent\s*account)|PAN.{0,40}first\s*[45]).{0,80}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob|dd\s*mm)/i,
      /(?:date\s*of\s*birth|d\.?o\.?b\.?|dob|ddmm).{0,80}(?:first\s*[45].{0,30}(?:PAN|permanent\s*account)|PAN)/i,
    ],
    hint: "Password often combines the first characters of your PAN with your date of birth",
    example: "ABCD1508",
  },
  {
    id: "dob_ddmmyyyy",
    matchers: [
      /(?:date\s*of\s*birth|d\.?o\.?b\.?|dob).{0,80}(?:dd\s*[/-]?\s*mm\s*[/-]?\s*yyyy|ddmmyyyy)/i,
      /(?:dd\s*[/-]?\s*mm\s*[/-]?\s*yyyy|ddmmyyyy).{0,80}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob)/i,
      /password.{0,100}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob).{0,40}(?:ddmmyyyy|dd\s*[/-]\s*mm\s*[/-]\s*yyyy)/i,
    ],
    hint: "Password is often your date of birth in DDMMYYYY format",
    example: "15081990",
  },
  {
    id: "dob_ddmmyy",
    matchers: [
      /(?:date\s*of\s*birth|d\.?o\.?b\.?|dob).{0,80}(?:dd\s*[/-]?\s*mm\s*[/-]?\s*yy\b|ddmmyy\b)/i,
      /(?:dd\s*[/-]?\s*mm\s*[/-]?\s*yy\b|ddmmyy\b).{0,80}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob)/i,
    ],
    hint: "Password is often your date of birth in DDMMYY format",
    example: "150890",
  },
  {
    id: "dob_generic",
    matchers: [
      /password.{0,100}(?:date\s*of\s*birth|d\.?o\.?b\.?|dob)\b/i,
      /(?:date\s*of\s*birth|d\.?o\.?b\.?|dob).{0,60}(?:password|passcode|to\s+open|to\s+unlock)/i,
    ],
    hint: "Password is often your date of birth (commonly DDMMYYYY)",
    example: "15081990",
  },
  {
    id: "card_last4",
    matchers: [
      /(?:last\s*(?:4|four)\s*(?:digits?|numbers?)).{0,50}(?:card|credit\s*card)/i,
      /(?:card|credit\s*card).{0,50}(?:last\s*(?:4|four)\s*(?:digits?|numbers?))/i,
      /password.{0,100}(?:last\s*(?:4|four)).{0,40}card/i,
    ],
    hint: "Password is often the last 4 digits of your card number",
    example: "1234",
  },
  {
    id: "pan_first",
    matchers: [
      /(?:first\s*(?:4|5|four|five)\s*(?:characters?|letters?|digits?)).{0,40}(?:PAN|permanent\s*account)/i,
      /(?:PAN|permanent\s*account).{0,60}(?:first\s*(?:4|5|four|five))/i,
      /password.{0,100}(?:PAN|permanent\s*account)/i,
    ],
    hint: "Password often uses the first 4–5 characters of your PAN",
    example: "ABCDE",
  },
  {
    id: "mobile_last",
    matchers: [
      /(?:last\s*(?:4|5|four|five)\s*(?:digits?|numbers?)).{0,50}(?:mobile|phone|registered)/i,
      /(?:mobile|phone|registered\s*mobile).{0,60}(?:last\s*(?:4|5|four|five))/i,
    ],
    hint: "Password is often the last 4–5 digits of your registered mobile number",
    example: "98765",
  },
  {
    id: "account_last",
    matchers: [
      /(?:last\s*(?:4|6|four|six)\s*(?:digits?|numbers?)).{0,50}(?:account|a\/c|acct)/i,
      /(?:account|a\/c|acct).{0,60}(?:last\s*(?:4|6|four|six))/i,
    ],
    hint: "Password is often the last 4–6 digits of your account number",
    example: "5678",
  },
  {
    id: "customer_id",
    matchers: [
      /password.{0,80}(?:customer\s*(?:id|number)|cust\.?\s*id|cif\b|netbanking\s*id)/i,
      /(?:customer\s*(?:id|number)|cust\.?\s*id|cif\b).{0,60}(?:password|passcode|to\s+open)/i,
    ],
    hint: "Password may be your customer ID / CIF",
    example: "",
  },
] as const;

/**
 * Staged labels for Gmail sync progress.
 * Percentages are client-estimated — `/api/gmail/sync` does not stream real progress.
 */
export const GMAIL_SYNC_PROGRESS_STAGES = [
  { until: 20, label: GMAIL_UI_TEXT.SYNC_PROGRESS_SEARCHING },
  { until: 45, label: GMAIL_UI_TEXT.SYNC_PROGRESS_DOWNLOADING },
  { until: 70, label: GMAIL_UI_TEXT.SYNC_PROGRESS_PARSING },
  { until: 90, label: GMAIL_UI_TEXT.SYNC_PROGRESS_DEDUPING },
  { until: 100, label: GMAIL_UI_TEXT.SYNC_PROGRESS_DONE },
] as const;

export const GMAIL_ERROR_MESSAGES = {
  OAUTH_NOT_CONFIGURED: "Google OAuth credentials are not configured in environment variables.",
  OAUTH_EXCHANGE_FAILED: "Failed to exchange Google OAuth code",
  TOKEN_REFRESH_FAILED: "Failed to refresh Google access token",
  TOKEN_REFRESH_RECONNECT: "Could not refresh Gmail access. Please reconnect Gmail and try again.",
  ACCOUNT_NOT_CONNECTED: "Gmail account not connected. Please connect your Gmail first.",
  ATTACHMENT_DOWNLOAD_FAILED: "Failed to download attachment from Gmail API",
  ATTACHMENT_EMPTY: "Empty attachment data received from Gmail API",
  MESSAGE_FETCH_FAILED: "Failed to get Gmail message",
  SEARCH_FAILED: "Failed to search Gmail messages",
  SYNC_FAILED: "Failed to sync transactions from Gmail",
  DISCONNECT_FAILED: "Failed to disconnect Gmail",
  INVALID_DATE_RANGE: "Start date cannot be after end date.",
  PDF_LOCKED_ATTACHMENT: '"{filename}" is password-locked. Unlock it in Import Review with the statement password.',
  ATTACHMENT_PARSE_FAILED: 'Couldn’t read "{filename}". Try again or upload the file manually.',
  ALERT_PARSE_FAILED: "Couldn’t read one transaction alert email. Other items were still synced.",
  MESSAGE_PROCESS_FAILED: "Couldn’t process one Gmail message. Other items were still synced.",
  UNLOCK_ATTACHMENT_FAILED:
    "Couldn’t finish unlocking this statement. If the password was accepted, wait a moment and try again.",
  UNLOCK_MISSING_FIELDS: "Missing Gmail attachment details. Sync again from Gmail.",
  SETTINGS_UPDATE_FAILED: "Failed to update auto-sync settings.",
  USER_MISMATCH: "You can only access your own Gmail integration.",
  OAUTH_USER_REQUIRED: "Sign in before connecting Gmail.",
  OAUTH_STATE_INVALID: "Gmail connection link expired or was invalid. Try connecting again.",
  OAUTH_CONNECT_FAILED: "Failed to connect Gmail. Please try again.",
  OAUTH_REDIRECT_URI_REQUIRED:
    "GOOGLE_REDIRECT_URI must be set for non-local hosts (Host headers are not trusted in production).",
  UNAUTHORIZED: "Sign in to continue.",
} as const;
