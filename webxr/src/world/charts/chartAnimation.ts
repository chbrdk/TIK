/** Easing for in-world chart reveal (0→1). */
export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

export function animatedBarHeight(targetPct: number, progress: number, maxHeight: number): number {
  return maxHeight * (targetPct / 100) * easeOutCubic(progress)
}
