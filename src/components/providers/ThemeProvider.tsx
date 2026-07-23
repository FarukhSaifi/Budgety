"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  applyResolvedTheme,
  getSystemPrefersDark,
  readStoredThemePreference,
  resolveThemePreference,
  subscribeSystemPrefersDark,
  writeStoredThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggleLightDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getServerSystemDarkSnapshot() {
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const preferenceRef = useRef<ThemePreference>("system");
  const didReadStorageRef = useRef(false);

  const systemDark = useSyncExternalStore(
    subscribeSystemPrefersDark,
    getSystemPrefersDark,
    getServerSystemDarkSnapshot,
  );

  const resolved = useMemo(() => resolveThemePreference(preference, systemDark), [preference, systemDark]);

  /**
   * Apply before paint. Always resolve System via live `matchMedia` so we never
   * overwrite the FOUC script with the SSR snapshot (`systemDark === false`).
   * `systemDark` in the dependency list re-runs this when the OS theme changes.
   */
  useLayoutEffect(() => {
    preferenceRef.current = preference;

    if (!didReadStorageRef.current) {
      didReadStorageRef.current = true;
      const stored = readStoredThemePreference();
      preferenceRef.current = stored;
      setPreferenceState(stored);
      applyResolvedTheme(resolveThemePreference(stored, getSystemPrefersDark()));
      return;
    }
    applyResolvedTheme(resolveThemePreference(preferenceRef.current, getSystemPrefersDark()));
  }, [preference, systemDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    preferenceRef.current = next;
    setPreferenceState(next);
    writeStoredThemePreference(next);
    applyResolvedTheme(resolveThemePreference(next, getSystemPrefersDark()));
  }, []);

  const toggleLightDark = useCallback(() => {
    setPreference(resolved === "dark" ? "light" : "dark");
  }, [resolved, setPreference]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggleLightDark }),
    [preference, resolved, setPreference, toggleLightDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
