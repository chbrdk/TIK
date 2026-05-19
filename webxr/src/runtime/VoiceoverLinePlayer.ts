import type { VoiceoverLine } from '@/schema/scene-config'
import type { NarrativeListener } from './narrative-events'

const WPM = 2.5

function estimateLineDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1.5, words / WPM)
}

export function lineEndSec(line: VoiceoverLine): number {
  const pause = line.pause_after_sec ?? 0.4
  return line.at_sec + estimateLineDuration(line.text) + pause
}

export class VoiceoverLinePlayer {
  private timeouts: ReturnType<typeof globalThis.setTimeout>[] = []
  private onComplete: (() => void) | null = null

  constructor(
    private readonly emit: NarrativeListener,
    private readonly trackId: string,
  ) {}

  play(lines: VoiceoverLine[], onComplete?: () => void) {
    this.clear()
    this.onComplete = onComplete ?? null
    if (!lines.length) {
      this.finish()
      return
    }

    const sorted = [...lines].sort((a, b) => a.at_sec - b.at_sec)
    let maxEnd = 0

    for (let i = 0; i < sorted.length; i++) {
      const line = sorted[i]
      const startMs = line.at_sec * 1000
      const id = globalThis.setTimeout(() => {
        this.emit({
          type: 'subtitle',
          text: line.text,
          trackId: this.trackId,
          lineIndex: i,
          totalLines: sorted.length,
        })
      }, startMs)
      this.timeouts.push(id)
      maxEnd = Math.max(maxEnd, lineEndSec(line))
    }

    const doneId = globalThis.setTimeout(() => this.finish(), maxEnd * 1000)
    this.timeouts.push(doneId)
  }

  private finish() {
    this.emit({ type: 'subtitle_clear' })
    this.onComplete?.()
    this.onComplete = null
  }

  clear() {
    for (const id of this.timeouts) globalThis.clearTimeout(id)
    this.timeouts = []
    this.onComplete = null
  }
}
