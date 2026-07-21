"use client";

import { UI_TEXT } from "@constants";
import { useAuth } from "@context/AuthContext";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { Button } from "@ui/Button";
import { showError, showSuccess } from "@utils/toast";
import { useState } from "react";

const AuthPage = () => {
  const { isConfigured, signIn, signUp, signInWithGoogle } = useAuth();
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
        await signIn(email.trim(), password);
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_IN);
      } else {
        await signUp(email.trim(), password, name.trim());
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_UP);
      }
    } catch (err) {
      showError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_IN);
    } catch (err) {
      showError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-800">
          {mode === "signin" ? UI_TEXT.AUTH_SIGN_IN_TITLE : UI_TEXT.AUTH_SIGN_UP_TITLE}
        </h1>

        {!isConfigured && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
            {UI_TEXT.AUTH_ERROR_NOT_CONFIGURED}
          </p>
        )}

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
              minLength={6}
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

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-gray-400">{UI_TEXT.AUTH_OR}</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          size="md"
          className="py-2.5"
          disabled={loading}
          onClick={handleGoogle}
        >
          {UI_TEXT.AUTH_CONTINUE_WITH_GOOGLE}
        </Button>

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
