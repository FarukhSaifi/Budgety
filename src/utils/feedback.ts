import { UI_MOTION } from "@constants";

const SUCCESS_CLASS = "motion-success-pop";

/**
 * One-shot success flash on an element (CSS class toggle).
 * No-ops when reduced motion is preferred or `el` is missing.
 */
export function flashSuccess(el: HTMLElement | null | undefined, durationMs = UI_MOTION.SUCCESS_FLASH_MS): void {
  if (!el || typeof window === "undefined") return;
  const reduce =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  el.classList.remove(SUCCESS_CLASS);
  // Force reflow so re-adding the class restarts the animation.
  void el.offsetWidth;
  el.classList.add(SUCCESS_CLASS);
  window.setTimeout(() => {
    el.classList.remove(SUCCESS_CLASS);
  }, durationMs);
}

/** Light haptic tap on supported mobile browsers (~10–15ms). Never for errors. */
export function hapticTap(durationMs = UI_MOTION.HAPTIC_MS): void {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(durationMs);
  } catch {
    // Unsupported / blocked — ignore.
  }
}
