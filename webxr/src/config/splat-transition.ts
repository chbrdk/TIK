/** Act-to-act visual transition (splat dissolve + reassemble). */
export const splatTransition = {
  /** Total crossfade length (ms). */
  durationMs: Number(import.meta.env.VITE_SPLAT_TRANSITION_MS ?? '8000'),
  /** Timeline: outgoing splats dissolve in [0, dissolveEnd]. */
  dissolveEnd: 0.52,
  /** Timeline: incoming splats reveal in [revealStart, 1]. */
  revealStart: 0.38,
  /** Width of per-point fade window (0–1 timeline units). */
  staggerSoftness: Number(import.meta.env.VITE_SPLAT_STAGGER_SOFTNESS ?? '0.16'),
  outgoingScaleBoost: 0.1,
  incomingScaleStart: 0.1,
} as const

/** Smoothstep ease in/out for crossfade progress. */
export function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** Map global progress into a phase window 0→1. */
export function phaseProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return easeInOutCubic((progress - start) / (end - start))
}

export function outgoingDissolveOpacity(progress: number): number {
  const local = phaseProgress(progress, 0, splatTransition.dissolveEnd)
  return Math.max(0, 1 - local * 0.35)
}

export function incomingRevealOpacity(progress: number): number {
  const local = phaseProgress(progress, splatTransition.revealStart, 1)
  return Math.min(1, 0.65 + local * 0.35)
}

export function outgoingDissolveScale(progress: number): number {
  const local = phaseProgress(progress, 0, splatTransition.dissolveEnd)
  return 1 + splatTransition.outgoingScaleBoost * local
}

export function incomingRevealScale(progress: number): number {
  const local = phaseProgress(progress, splatTransition.revealStart, 1)
  return 1 + splatTransition.incomingScaleStart * (1 - local)
}

/** Extra Spark culling while outgoing splats dissolve. */
export function dissolveMinAlpha(progress: number): number {
  const local = phaseProgress(progress, 0, splatTransition.dissolveEnd)
  const base = 0.5 * (1 / 255)
  const peak = 0.28
  return base + (peak - base) * local
}
