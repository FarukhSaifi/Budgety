"use client";

import type { ThemePreference } from "@/lib/theme";
import { DarkModeIcon } from "@components/icons";
import { useTheme } from "@components/providers/ThemeProvider";
import { UI_TEXT } from "@constants";
import { cn } from "@utils/cn";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: UI_TEXT.THEME_LIGHT },
  { value: "dark", label: UI_TEXT.THEME_DARK },
  { value: "system", label: UI_TEXT.THEME_SYSTEM },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, resolved, setPreference, toggleLightDark } = useTheme();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
            <DarkModeIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-deep">{UI_TEXT.APPEARANCE}</p>
            <p className="text-xs text-gray-400">{resolved === "dark" ? UI_TEXT.THEME_DARK : UI_TEXT.THEME_LIGHT}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleLightDark}
          className="rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-semibold text-brand-deep"
          aria-label={UI_TEXT.TOGGLE_THEME}
        >
          {resolved === "dark" ? UI_TEXT.THEME_LIGHT : UI_TEXT.THEME_DARK}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPreference(opt.value)}
            className={cn(
              "rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
              preference === opt.value
                ? "border-primary-main bg-primary-soft text-primary-main"
                : "border-outline-variant/60 bg-card text-on-surface-variant",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
