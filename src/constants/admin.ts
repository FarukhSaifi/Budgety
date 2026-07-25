/** Firebase Auth custom claim key for platform admins. */
export const ADMIN_CLAIM_KEY = "admin" as const;

/** Comma-separated UID allowlist env (server-only bootstrap). */
export const ADMIN_UIDS_ENV = "ADMIN_UIDS" as const;

/** Firebase Admin SDK credential env keys (server-only). */
export const FIREBASE_ADMIN_ENV = {
  PROJECT_ID: "FIREBASE_ADMIN_PROJECT_ID",
  CLIENT_EMAIL: "FIREBASE_ADMIN_CLIENT_EMAIL",
  PRIVATE_KEY: "FIREBASE_ADMIN_PRIVATE_KEY",
} as const;

/** Max users returned from a single Admin listUsers call. */
export const ADMIN_USERS_PAGE_SIZE = 100;

/** Hard cap when scanning Auth users for search (personal apps stay small). */
export const ADMIN_USERS_MAX_SCAN = 1000;

/** Admin API path prefixes (App Router). */
export const ADMIN_API_ROUTES = {
  me: "/api/admin/me",
  users: "/api/admin/users",
  user: (uid: string) => `/api/admin/users/${encodeURIComponent(uid)}`,
} as const;

export type AdminUserRole = "admin" | "user";

export const ADMIN_USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const satisfies Record<string, AdminUserRole>;
