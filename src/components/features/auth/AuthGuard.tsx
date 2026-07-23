"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { UI_TEXT } from "@constants";

import { Spinner } from "@common";

import { useAppSelector } from "@store/hooks";

export interface AuthGuardProps {
  children: ReactNode;
  /** When true, the route is for guests only (login/register) and signed-in
   *  users are redirected to the app. Otherwise unauthenticated users are
   *  redirected to /login. */
  guestOnly?: boolean;
}

/**
 * Route gate. Auth state + Firestore sync are established by AuthBootstrap
 * (mounted in AppProviders); this component only decides what to render based
 * on the authenticated user.
 */
export default function AuthGuard({ children, guestOnly = false }: AuthGuardProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const initialized = useAppSelector((state) => state.auth.initialized);

  useEffect(() => {
    if (!initialized) return;
    if (guestOnly && user) {
      router.replace("/");
    } else if (!guestOnly && !user) {
      router.replace("/login");
    }
  }, [initialized, user, guestOnly, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner label={UI_TEXT.LOADING} />
      </div>
    );
  }

  // Avoid flashing protected/guest content during the redirect tick.
  if ((guestOnly && user) || (!guestOnly && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner label={UI_TEXT.LOADING} />
      </div>
    );
  }

  return <>{children}</>;
}
