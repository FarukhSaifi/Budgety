"use client";

import { UI_TEXT } from "@constants";
import { useAuth } from "@context/AuthContext";
import { Button } from "@ui/Button";
import { showError, showSuccess } from "@utils/toast";
import { useState } from "react";

const AuthPage = () => {
  const { signIn, signUp, useSession } = useAuth();
  const { isPending } = useSession();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email?.trim() || !password?.trim()) return;
    if (mode === "signup" && !name?.trim()) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        const res = await signIn.email({ email: email.trim(), password });
        if (res?.error) {
          showError(res.error.message || UI_TEXT.AUTH_ERROR_INVALID_CREDENTIALS);
          return;
        }
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_IN);
      } else {
        const res = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        if (res?.error) {
          showError(res.error.message || UI_TEXT.AUTH_ERROR_EMAIL_IN_USE);
          return;
        }
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_UP);
        setMode("signin");
        setPassword("");
      }
    } catch (err) {
      showError(err?.message || UI_TEXT.AUTH_GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">{UI_TEXT.LOADING}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-800">
          {mode === "signin" ? UI_TEXT.AUTH_SIGN_IN_TITLE : UI_TEXT.AUTH_SIGN_UP_TITLE}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="auth-name" className="mb-1 block text-sm font-medium text-gray-700">
                {UI_TEXT.NAME}
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={UI_TEXT.AUTH_NAME_PLACEHOLDER}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-gray-700">
              {UI_TEXT.EMAIL}
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={UI_TEXT.AUTH_EMAIL_PLACEHOLDER}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-gray-700">
              {UI_TEXT.PASSWORD}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
            {mode === "signup" && <p className="mt-1 text-xs text-gray-500">{UI_TEXT.AUTH_PASSWORD_HINT}</p>}
          </div>
          <Button type="submit" variant="primary" fullWidth size="md" className="mt-2 py-2.5" disabled={loading}>
            {loading ? UI_TEXT.LOADING : mode === "signin" ? UI_TEXT.SIGN_IN : UI_TEXT.SIGN_UP}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === "signin" ? (
            <>
              {UI_TEXT.AUTH_NO_ACCOUNT}{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-medium text-blue-600 hover:underline"
              >
                {UI_TEXT.SIGN_UP}
              </button>
            </>
          ) : (
            <>
              {UI_TEXT.AUTH_HAVE_ACCOUNT}{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-medium text-blue-600 hover:underline"
              >
                {UI_TEXT.SIGN_IN}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
