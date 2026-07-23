"use client";

import { CURRENCY_SYMBOL, UI_TEXT } from "@constants";

import { ThemeToggle } from "@common";

import {
  AccountBalanceWalletIcon,
  CalendarClockIcon,
  CreditCardIcon,
  FlagIcon,
  GroupIcon,
  LogoutIcon,
  MenuIcon,
  NotificationsIcon,
  PersonIcon,
  TuneIcon,
} from "@components/icons";
import { ProfileSettingRow } from "@components/mobile";

import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { signOutUser } from "@store/slices/authSlice";
import { showSuccess } from "@utils/toast";

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigateToTab = useAppNavigation();
  const user = useAppSelector((s) => s.auth.user);
  const bills = useAppSelector((s) => s.bills.items);

  const displayName = user?.displayName || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const pendingNotifs = bills.filter(
    (b) => !b.isPaid && b.status !== "paid",
  ).length;

  const handleSignOut = async () => {
    await dispatch(signOutUser());
    showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_OUT);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex items-center justify-between">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-card text-brand-deep"
          aria-label="Menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-brand-deep">{UI_TEXT.PROFILE}</h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-expense"
          aria-label={UI_TEXT.SIGN_OUT}
        >
          <LogoutIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col items-center text-center">
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-3xl font-bold text-primary-main shadow-card">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <h2 className="mt-3 text-xl font-bold text-brand-deep">{displayName}</h2>
        {user?.email && (
          <p className="text-sm text-gray-400">{user.email}</p>
        )}
      </div>

      <section>
        <h3 className="mb-1 text-sm font-bold text-brand-deep">
          {UI_TEXT.ACCOUNT_SETTING}
        </h3>
        <div className="rounded-card bg-card px-3 shadow-card">
          <ProfileSettingRow
            icon={PersonIcon}
            title={UI_TEXT.EDIT_PROFILE}
            subtitle={user?.email || UI_TEXT.NAME}
          />
          <ProfileSettingRow
            icon={TuneIcon}
            title={UI_TEXT.SECURITY_PRIVACY}
            subtitle="PIN, biometric & privacy"
          />
          <ProfileSettingRow
            icon={NotificationsIcon}
            title={UI_TEXT.NOTIFICATIONS}
            subtitle="Push & email alerts"
            badge={
              pendingNotifs > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-bold text-white">
                  {pendingNotifs > 9 ? "9+" : pendingNotifs}
                </span>
              ) : undefined
            }
            onClick={() => navigateToTab("bills")}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-bold text-brand-deep">
          {UI_TEXT.APP_SETTING}
        </h3>
        <div className="rounded-card bg-card px-3 shadow-card">
          <div className="border-b border-gray-100 py-3.5">
            <ThemeToggle />
          </div>
          <ProfileSettingRow
            icon={AccountBalanceWalletIcon}
            title={UI_TEXT.CURRENCY_LANGUAGE}
            subtitle={`${CURRENCY_SYMBOL} INR · English`}
          />
          <ProfileSettingRow
            icon={FlagIcon}
            title={UI_TEXT.GOALS}
            subtitle={UI_TEXT.SAVINGS_GOALS}
            onClick={() => navigateToTab("goals")}
          />
          <ProfileSettingRow
            icon={CalendarClockIcon}
            title={UI_TEXT.BILLS}
            subtitle={UI_TEXT.RECURRING_TRANSACTIONS}
            onClick={() => navigateToTab("bills")}
          />
          <ProfileSettingRow
            icon={AccountBalanceWalletIcon}
            title={UI_TEXT.BUDGETS}
            subtitle={UI_TEXT.BUDGET_VS_ACTUAL}
            onClick={() => navigateToTab("budgets")}
          />
          <ProfileSettingRow
            icon={CreditCardIcon}
            title={UI_TEXT.DEBT_PAYOFF}
            subtitle={UI_TEXT.DEBT_TRACKER}
            onClick={() => navigateToTab("debt")}
          />
          <ProfileSettingRow
            icon={GroupIcon}
            title={UI_TEXT.SPLIT_EXPENSES}
            subtitle={UI_TEXT.SPLIT_TRACKER}
            onClick={() => navigateToTab("split")}
          />
          <ProfileSettingRow
            icon={TuneIcon}
            title={UI_TEXT.SMART_RULES}
            subtitle={UI_TEXT.RULES_TITLE}
            onClick={() => navigateToTab("rules")}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 py-3.5 text-sm font-semibold text-expense"
      >
        <LogoutIcon className="h-4 w-4" />
        {UI_TEXT.SIGN_OUT}
      </button>
    </div>
  );
}
