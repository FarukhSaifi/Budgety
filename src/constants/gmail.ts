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
  { label: "Last 60 days", value: 60 },
  { label: "Last 90 days (Quarter)", value: 90 },
  { label: "Last 180 days (6 Months)", value: 180 },
  { label: "Last 365 days (1 Year)", value: 365 },
] as const;

export const GMAIL_AUTO_SYNC_INTERVALS = [
  { label: "Every 6 hours", hours: 6 },
  { label: "Every 12 hours (Twice daily)", hours: 12 },
  { label: "Every 24 hours (Daily)", hours: 24 },
  { label: "Every 48 hours (Every 2 days)", hours: 48 },
] as const;

export const GMAIL_DEFAULTS = {
  DAYS_BACK: 30,
  MAX_SEARCH_RESULTS: 35,
  MAX_DURATION_SECONDS: 120,
  TOKEN_REFRESH_EXPIRY_THRESHOLD_MS: 60_000,
  DEFAULT_USER_ID: "default_user",
  AUTO_SYNC_INTERVAL_HOURS: 12,
  AUTO_SYNC_DAYS_BACK: 7,
} as const;

export const GMAIL_UI_TEXT = {
  TITLE: "Gmail Statement & Alert Auto-Sync",
  CONNECTED: "Connected",
  NOT_CONNECTED: "Not Connected",
  CONNECTED_SUBTITLE: "Syncing from {email} (HDFC, ICICI, SBI, Axis, Kotak & credit cards)",
  DISCONNECTED_SUBTITLE: "Automatically fetch bank statements and transaction alerts directly from your Gmail inbox.",
  LAST_SYNCED: "Last synced: {time}",
  CHECKING: "Checking...",
  SCANNING: "Scanning Gmail...",
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
  PDF_PASSWORD: "PDF Statement Password",
  PDF_PASSWORD_PLACEHOLDER: "Optional (e.g. DOB/PAN)",
  PDF_PASSWORD_HINT: "Used if bank e-statements are password-locked",
  SOURCES: "Sources",
  SOURCE_ALERTS: "Instant transaction alerts",
  SOURCE_STATEMENTS: "e-Statement PDF attachments",
  SYNC_SUMMARY: "Sync Summary",
  EMAILS_SCANNED: "Emails Scanned",
  ALERTS_FOUND: "Alerts Found",
  STATEMENTS_FOUND: "Statements Found",
  DUPLICATES_SKIPPED: "Duplicates Skipped",
  INTEGRATION_SETTINGS_TITLE: "Connected Services & Automations",
} as const;

export const GMAIL_ERROR_MESSAGES = {
  OAUTH_NOT_CONFIGURED: "Google OAuth credentials are not configured in environment variables.",
  OAUTH_EXCHANGE_FAILED: "Failed to exchange Google OAuth code",
  TOKEN_REFRESH_FAILED: "Failed to refresh Google access token",
  ACCOUNT_NOT_CONNECTED: "Gmail account not connected. Please connect your Gmail first.",
  ATTACHMENT_DOWNLOAD_FAILED: "Failed to download attachment from Gmail API",
  MESSAGE_FETCH_FAILED: "Failed to get Gmail message",
  SYNC_FAILED: "Failed to sync transactions from Gmail",
  DISCONNECT_FAILED: "Failed to disconnect Gmail",
  INVALID_DATE_RANGE: "Start date cannot be after end date.",
} as const;
