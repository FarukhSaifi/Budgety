"use client";

import { useCallback, useEffect, useState } from "react";

import { ADMIN_API_ROUTES } from "@constants/admin";

import { useAppSelector } from "@store/hooks";

import { adminFetch } from "@/lib/adminApiClient";

interface AdminAccessState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Client gate for Admin UI (nav + AdminGuard).
 * Server `/api/admin/*` remains the source of truth for mutations.
 */
export function useAdminAccess(): AdminAccessState {
  const uid = useAppSelector((s) => s.auth.user?.uid);
  const authInitialized = useAppSelector((s) => s.auth.initialized);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    if (!uid) {
      setIsAdmin(false);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const res = await adminFetch(ADMIN_API_ROUTES.me);
        if (cancelled) return;
        if (res.ok) {
          setIsAdmin(true);
          setError(null);
        } else {
          setIsAdmin(false);
          setError(null);
        }
      } catch {
        if (cancelled) return;
        setIsAdmin(false);
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, authInitialized, tick]);

  return { isAdmin, loading, error, refresh };
}
