import { splatTransition } from '@/config/splat-transition'

export interface CrossfadeAnimationOptions {
  durationMs?: number
  onProgress: (progress: number) => void
  signal?: AbortSignal
}

/** Animates progress 0→1; returns when complete. */
export function runActCrossfade(options: CrossfadeAnimationOptions): Promise<void> {
  const durationMs = options.durationMs ?? splatTransition.durationMs

  return new Promise((resolve, reject) => {
    const start = performance.now()

    const tick = () => {
      if (options.signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const elapsed = performance.now() - start
      const progress = Math.min(1, elapsed / durationMs)
      options.onProgress(progress)
      if (progress >= 1) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}
