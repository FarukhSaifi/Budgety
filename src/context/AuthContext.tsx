"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useAppSelector } from "@store/hooks";
import { useAppDispatch } from "@store/hooks";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle as signInWithGoogleThunk,
  signOutUser as signOutUserThunk,
} from "@store/slices/authSlice";

interface AuthContextValue {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<unknown>;
  signUp: (email: string, password: string, name: string) => Promise<unknown>;
  signInWithGoogle: () => Promise<unknown>;
  signOutUser: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, loading, isConfigured } = useAppSelector((s) => s.auth);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured,
      signIn: (email, password) =>
        dispatch(signInWithEmail({ email, password })).unwrap(),
      signUp: (email, password, name) =>
        dispatch(signUpWithEmail({ email, password, name })).unwrap(),
      signInWithGoogle: () => dispatch(signInWithGoogleThunk()).unwrap(),
      signOutUser: () => dispatch(signOutUserThunk()).unwrap(),
    }),
    [dispatch, user, loading, isConfigured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
