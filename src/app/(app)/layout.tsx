"use client";

import AuthGuard from "@components/features/auth/AuthGuard";
import { AppShell } from "@components/shell/AppShell";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
