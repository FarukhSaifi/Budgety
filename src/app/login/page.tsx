"use client";

import AuthForm from "@components/features/auth/AuthForm";
import AuthGuard from "@components/features/auth/AuthGuard";

export default function LoginPage() {
  return (
    <AuthGuard guestOnly>
      <AuthForm mode="signin" />
    </AuthGuard>
  );
}
