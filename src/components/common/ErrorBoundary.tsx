"use client";

import { ERROR_MESSAGES, UI_TEXT } from "@constants";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** App-level error boundary with a user-friendly fallback (no stray console noise). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally swallowed — surfaced to the user via the fallback UI.
    // Hook a real reporter (e.g. Crashlytics/Sentry) here in production.
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
          <p className="text-lg font-semibold text-gray-900">{ERROR_MESSAGES.BOUNDARY_FALLBACK}</p>
          <Button onClick={this.handleReset}>{UI_TEXT.TRY_AGAIN}</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
