"use client";

import { useMemo, useState, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import { AddTransactionSheet } from "@components/mobile/AddTransactionSheet";

import { useSyncActiveTabFromPath } from "@hooks/useAppNavigation";
import { useAppSelector } from "@store/hooks";
import { selectPeriodTotalExpense } from "@store/selectors/periodSelectors";
import { cn } from "@utils/cn";

import { BottomNav } from "./BottomNav";
import { SELF_HEADER_TABS } from "./navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Authenticated app chrome: sidebar, top bar, bottom nav + FAB.
 * Route pages render as `children` inside `<main>`.
 */
export function AppShell({ children }: AppShellProps) {
  useSyncActiveTabFromPath();

  const pathname = usePathname();
  const activeTab = useAppSelector((state) => state.ui.activeTab);
  const budgets = useAppSelector((s) => s.budgets.items);
  const totalExpense = useAppSelector(selectPeriodTotalExpense);
  const [sheetOpen, setSheetOpen] = useState(false);

  const budgetLimit = useMemo(
    () => budgets.filter((b) => b.period === "monthly").reduce((sum, b) => sum + (b.limitAmount || 0), 0),
    [budgets],
  );

  const budgetPct = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : null;

  const isImportPage = Boolean(pathname?.startsWith("/transactions/import"));
  const hideTopBarMobile = SELF_HEADER_TABS.includes(activeTab) || isImportPage;
  const hideTopBarDesktop = isImportPage;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:ml-20">
        <div className={cn(hideTopBarMobile && "hidden md:block", hideTopBarDesktop && "md:hidden")}>
          <TopBar />
        </div>
        <main
          className={cn(
            "flex-1 px-margin-mobile pb-28 pt-3 md:px-6 md:pb-8 md:pt-4 lg:px-8",
            hideTopBarMobile && "pt-safe",
            isImportPage && "px-0 md:px-0 lg:px-0",
          )}
        >
          {children}
        </main>
      </div>
      <BottomNav onFabClick={() => setSheetOpen(true)} />
      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} budgetPct={budgetPct} />
    </div>
  );
}
