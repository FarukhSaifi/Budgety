"use client";

import { useState } from "react";

/**
 * Resets local form state when a modal/sheet opens or its entity id changes.
 * Uses React's render-time adjustment pattern instead of useEffect + setState.
 */
export function useResetOnOpen(
  open: boolean,
  entityId: string | null | undefined,
  reset: () => void,
): void {
  const resetKey = open ? (entityId ?? "new") : "closed";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (open) reset();
  }
}
