"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { UI_TEXT } from "@constants";

import { APP_ROUTES } from "@constants/routes";

import { EmptyState, Spinner } from "@common";

import { ShieldIcon } from "@components/icons";

import { useAdminAccess } from "@hooks/useAdminAccess";

export interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Extra gate for `/admin`. AuthGuard already requires sign-in;
 * this ensures only platform admins see the page.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isAdmin, loading } = useAdminAccess();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      router.replace(APP_ROUTES.home);
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label={UI_TEXT.LOADING} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <EmptyState
          icon={<ShieldIcon className="h-6 w-6" />}
          title={UI_TEXT.ADMIN_ACCESS_DENIED_TITLE}
          description={UI_TEXT.ADMIN_ACCESS_DENIED_DESCRIPTION}
        />
      </div>
    );
  }

  return <>{children}</>;
}
