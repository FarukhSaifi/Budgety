import { UI_TEXT } from "@constants";

import { TAB_TO_PATH } from "@constants/routes";

import type { IconComponent } from "@components/icons";
import {
  AccountBalanceWalletIcon,
  BarChartIcon,
  CalendarClockIcon,
  CreditCardIcon,
  FlagIcon,
  GroupIcon,
  HomeIcon,
  PersonIcon,
  ReceiptLongIcon,
  TuneIcon,
} from "@components/icons";

import type { NavTab } from "@/types";

export interface NavItem {
  id: NavTab;
  label: string;
  icon: IconComponent;
  href: string;
}

/**
 * Primary Stitch bottom-nav tabs (4 + center FAB).
 * Icons match Dashboard Mobile Redesign / light screens:
 * home · receipt_long · bar_chart · person
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: "overview", label: UI_TEXT.HOME, icon: HomeIcon, href: TAB_TO_PATH.overview },
  {
    id: "transactions",
    label: UI_TEXT.TRANSACTION,
    icon: ReceiptLongIcon,
    href: TAB_TO_PATH.transactions,
  },
  {
    id: "analytics",
    label: UI_TEXT.ANALYTICS,
    icon: BarChartIcon,
    href: TAB_TO_PATH.analytics,
  },
  { id: "profile", label: UI_TEXT.PROFILE, icon: PersonIcon, href: TAB_TO_PATH.profile },
];

/** Secondary destinations kept reachable for feature parity. */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    id: "budgets",
    label: UI_TEXT.BUDGETS,
    icon: AccountBalanceWalletIcon,
    href: TAB_TO_PATH.budgets,
  },
  { id: "bills", label: UI_TEXT.BILLS, icon: CalendarClockIcon, href: TAB_TO_PATH.bills },
  { id: "goals", label: UI_TEXT.GOALS, icon: FlagIcon, href: TAB_TO_PATH.goals },
  { id: "debt", label: UI_TEXT.DEBT_PAYOFF, icon: CreditCardIcon, href: TAB_TO_PATH.debt },
  { id: "split", label: UI_TEXT.SPLIT_EXPENSES, icon: GroupIcon, href: TAB_TO_PATH.split },
  { id: "rules", label: UI_TEXT.SMART_RULES, icon: TuneIcon, href: TAB_TO_PATH.rules },
];

/** Full nav list for desktop sidebar (primary then secondary). */
export const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

export const TAB_TITLES: Record<NavTab, string> = {
  overview: UI_TEXT.HOME,
  transactions: UI_TEXT.TRANSACTION,
  analytics: UI_TEXT.ANALYTICS_AND_REPORTS,
  profile: UI_TEXT.PROFILE,
  budgets: UI_TEXT.BUDGETS,
  bills: UI_TEXT.BILLS,
  goals: UI_TEXT.GOALS,
  debt: UI_TEXT.DEBT_TRACKER,
  split: UI_TEXT.SPLIT_TRACKER,
  rules: UI_TEXT.RULES_TITLE,
};

/** Tabs that render their own mobile header (hide TopBar on small screens). */
export const SELF_HEADER_TABS: NavTab[] = [
  "overview",
  "transactions",
  "analytics",
  "profile",
  "bills",
];
