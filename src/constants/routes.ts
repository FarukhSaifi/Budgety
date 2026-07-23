import type { NavTab } from "@/types";

/** Canonical App Router paths for shell destinations. */
export const APP_ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  transactions: "/transactions",
  transactionsImport: "/transactions/import",
  analytics: "/analytics",
  profile: "/profile",
  bills: "/bills",
  goals: "/goals",
  budgets: "/budgets",
  reports: "/reports",
  login: "/login",
  register: "/register",
} as const;

export type AppRoutePath = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];

export const TAB_TO_PATH: Record<NavTab, string> = {
  overview: APP_ROUTES.home,
  transactions: APP_ROUTES.transactions,
  analytics: APP_ROUTES.analytics,
  profile: APP_ROUTES.profile,
  budgets: APP_ROUTES.budgets,
  bills: APP_ROUTES.bills,
  goals: APP_ROUTES.goals,
};

/**
 * Resolve Redux `activeTab` from a pathname.
 * Longer prefixes (e.g. `/transactions/import`) map to the parent tab.
 * Legacy `/reports` and `/report` map to the unified Analytics page.
 */
export function pathToTab(pathname: string | null | undefined): NavTab {
  if (!pathname) return "overview";
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/" || path === "/dashboard") return "overview";
  if (path.startsWith("/transactions")) return "transactions";
  if (path.startsWith("/analytics") || path.startsWith("/reports") || path === "/report") {
    return "analytics";
  }
  if (path.startsWith("/profile")) return "profile";
  if (path.startsWith("/budgets")) return "budgets";
  if (path.startsWith("/bills") || path === "/bill") return "bills";
  if (path.startsWith("/goals")) return "goals";
  return "overview";
}

export function isNavPathActive(
  pathname: string | null | undefined,
  tab: NavTab,
): boolean {
  return pathToTab(pathname) === tab;
}

/** Bottom-nav “active” rules that highlight parent for secondary screens. */
export function isPrimaryNavPathActive(
  pathname: string | null | undefined,
  primaryId: NavTab,
): boolean {
  const tab = pathToTab(pathname);
  if (primaryId === "analytics") {
    return tab === "analytics" || tab === "budgets";
  }
  if (primaryId === "profile") {
    return tab === "profile" || tab === "goals";
  }
  if (primaryId === "overview") {
    return tab === "overview" || tab === "bills";
  }
  return tab === primaryId;
}
