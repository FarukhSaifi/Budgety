"use client";

import { ERROR_MESSAGES, UI_TEXT } from "@constants";
import { Button } from "@ui/Button";
import { Component } from "react";

/**
 * Error boundary for graceful error handling and user-friendly fallback UI.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <p className="text-gray-700 mb-4" role="alert">
              {this.props.fallbackMessage ?? ERROR_MESSAGES.BOUNDARY_FALLBACK}
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => this.setState({ hasError: false })}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {UI_TEXT.TRY_AGAIN}
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
