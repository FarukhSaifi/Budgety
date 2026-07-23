"use client";

import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setCategories } from "@store/slices/uiSlice";
import {
  loadPersistedCategories,
  savePersistedCategories,
} from "@utils/categoryStorage";

/**
 * Hydrates custom categories from localStorage (keyed by Firebase uid) and
 * persists Redux `ui.categories` after the user adds new ones.
 * Device-local only — not synced across browsers.
 */
export function useCategoryPersistence(): void {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.auth.user?.uid);
  const categories = useAppSelector((s) => s.ui.categories);
  const hydratedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      hydratedForUser.current = null;
      dispatch(setCategories({ income: [], expense: [] }));
      return;
    }

    const persisted = loadPersistedCategories(userId);
    hydratedForUser.current = userId;
    dispatch(
      setCategories(
        persisted ?? {
          income: [],
          expense: [],
        },
      ),
    );
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId || hydratedForUser.current !== userId) return;
    savePersistedCategories(userId, categories);
  }, [userId, categories]);
}
