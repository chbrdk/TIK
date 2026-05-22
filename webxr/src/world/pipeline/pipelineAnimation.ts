/** Shared eased progress 0→1 for pipeline diagram reveals. */
export function pipelineRevealProgress(elapsedSec: number, durationSec: number): number {
  const t = Math.min(1, Math.max(0, elapsedSec / durationSec))
  return t * t * (3 - 2 * t)
}

export function pipelineStagger(progress: number, index: number, count: number): number {
  const slice = 1 / count
  const start = index * slice * 0.55
  return Math.min(1, Math.max(0, (progress - start) / (1 - start + 0.001)))
}
