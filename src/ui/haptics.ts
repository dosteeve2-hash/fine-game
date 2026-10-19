const patterns = {
  dice: [12, 40, 12],
  buy: [18],
  loss: [30, 50, 30]
} as const;

export type Haptic = keyof typeof patterns;

/** Short vibrations on Android; iOS Safari has no Vibration API and this does nothing there. */
export function haptic(kind: Haptic) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate([...patterns[kind]]);
  } catch {
    return;
  }
}
