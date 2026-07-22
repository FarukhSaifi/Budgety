"use client";

import { TAB_TO_PATH, pathToTab } from "@constants/routes";
import { useAppDispatch } from "@store/hooks";
import { setActiveTab } from "@store/slices/uiSlice";
import type { NavTab } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

/** Keep Redux `activeTab` aligned with the App Router pathname. */
export function useSyncActiveTabFromPath() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const tab = pathToTab(pathname);
    dispatch(setActiveTab(tab));
  }, [pathname, dispatch]);
}

/** Navigate to a shell tab via URL (and update Redux for immediate UI). */
export function useAppNavigation() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useCallback(
    (tab: NavTab) => {
      dispatch(setActiveTab(tab));
      router.push(TAB_TO_PATH[tab]);
    },
    [dispatch, router],
  );
}
