"use client";

import { APP_LOGO_ALT, APP_LOGO_SRC, APP_NAME, UI_TEXT } from "@constants";
import { useAuth } from "@context/AuthContext";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { showError, showSuccess } from "@utils/toast";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AuthMode = "signin" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

const INPUT_CLASSES =
  "w-full rounded-xl border border-outline-variant bg-card px-3 py-2.5 text-sm text-brand-deep outline-none transition placeholder:text-outline focus:border-primary-main focus:ring-2 focus:ring-primary-main/20";

export default function AuthForm({ mode }: AuthFormProps) {
  const { isConfigured, signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !name.trim()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, name.trim());
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_UP);
      } else {
        await signIn(email.trim(), password);
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_IN);
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
      const user = await signInWithGoogle();
      // null = redirect flow started (page will navigate to Google).
      if (user) {
        showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_IN);
      }
    } catch (err) {
      showError(getAuthErrorMessage(err));
      setLoading(false);
    }
    // Keep loading=true during redirect so the button stays disabled until unload.
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-surface-low via-surface to-primary-soft/40" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-container/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant/60 bg-card/95 p-6 shadow-elevated backdrop-blur md:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src={APP_LOGO_SRC}
              alt={APP_LOGO_ALT}
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-deep">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isSignUp ? UI_TEXT.AUTH_SIGN_UP_TITLE : UI_TEXT.AUTH_SIGN_IN_TITLE}
          </p>
        </div>

        {!isConfigured && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
            {UI_TEXT.AUTH_ERROR_NOT_CONFIGURED}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-sm font-medium text-brand-deep"
              >
                {UI_TEXT.NAME}
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={UI_TEXT.AUTH_NAME_PLACEHOLDER}
                className={INPUT_CLASSES}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-sm font-medium text-brand-deep"
            >
              {UI_TEXT.EMAIL}
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={UI_TEXT.AUTH_EMAIL_PLACEHOLDER}
              className={INPUT_CLASSES}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-sm font-medium text-brand-deep"
            >
              {UI_TEXT.PASSWORD}
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={UI_TEXT.AUTH_PASSWORD_HINT}
              className={INPUT_CLASSES}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full rounded-xl bg-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-container/25 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? UI_TEXT.LOADING
              : isSignUp
                ? UI_TEXT.SIGN_UP
                : UI_TEXT.SIGN_IN}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="text-xs uppercase tracking-wide text-on-surface-variant">
            {UI_TEXT.AUTH_OR}
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || !isConfigured}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-card px-4 py-2.5 text-sm font-medium text-brand-deep transition hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 3.8 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.7H12z"
            />
          </svg>
          {UI_TEXT.AUTH_CONTINUE_WITH_GOOGLE}
        </button>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {isSignUp ? UI_TEXT.AUTH_HAVE_ACCOUNT : UI_TEXT.AUTH_NO_ACCOUNT}{" "}
          <Link
            href={isSignUp ? "/login" : "/register"}
            className="font-semibold text-primary-main hover:underline"
          >
            {isSignUp ? UI_TEXT.SIGN_IN : UI_TEXT.SIGN_UP}
          </Link>
        </p>
      </div>
    </div>
  );
}
