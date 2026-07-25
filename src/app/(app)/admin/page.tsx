"use client";

import { AdminGuard } from "@components/features/auth/AdminGuard";
import { AdminUsersScreen } from "@components/screens/admin/AdminUsersScreen";

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminUsersScreen />
    </AdminGuard>
  );
}
