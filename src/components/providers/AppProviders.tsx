"use client";

import AuthBootstrap from "@components/providers/AuthBootstrap";
import { AuthProvider } from "@context/AuthContext";
import { TIMEOUTS } from "@constants";
import { ErrorBoundary } from "@common";
import ReduxProvider from "@store/ReduxProvider";
import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

/**
 * Client provider tree:
 * ErrorBoundary → Redux store → auth/Firestore bootstrap → auth context → app.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ReduxProvider>
        <AuthBootstrap>
          <AuthProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={TIMEOUTS.TOAST_SUCCESS}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AuthProvider>
        </AuthBootstrap>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
