"use client";

import type { ReactNode } from "react";

import { ToastContainer } from "react-toastify";

import { TIMEOUTS } from "@constants";

import { ErrorBoundary } from "@common";

import AuthBootstrap from "@components/providers/AuthBootstrap";
import { ThemeProvider, useTheme } from "@components/providers/ThemeProvider";

import { AuthProvider } from "@context/AuthContext";
import ReduxProvider from "@store/ReduxProvider";



function ThemedToasts() {
  const { resolved } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={TIMEOUTS.TOAST_SUCCESS}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={resolved === "dark" ? "dark" : "light"}
    />
  );
}

/**
 * Client provider tree:
 * ErrorBoundary → Redux → theme → auth/Firestore bootstrap → auth context → app.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ReduxProvider>
        <ThemeProvider>
          <AuthBootstrap>
            <AuthProvider>
              {children}
              <ThemedToasts />
            </AuthProvider>
          </AuthBootstrap>
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
