"use client";

import AuthPage from "@components/features/auth/AuthPage";
import { UI_TEXT } from "@constants";
import { useAuth } from "@context/AuthContext";

export default function RequireAuth({ children }) {
  const { useSession } = useAuth();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">{UI_TEXT.LOADING}</p>
      </div>
    );
  }

  if (!session?.user) {
    return <AuthPage />;
  }

  return children;
}
