"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { makeStore } from "@store";

/**
 * Client-side Redux provider. One store instance per browser session
 * (lazy useState so it is created once and never during SSR).
 */
export default function ReduxProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => makeStore());
  return <Provider store={store}>{children}</Provider>;
}
