import type { VoiceoverLine } from '@/schema/scene-config'
import type { NarrativeListener } from './narrative-events'
import { playNovaTrackMp3, stopNovaTrackMp3 } from './NovaAudioSession'

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
  private finished = false

  constructor(
    private readonly emit: NarrativeListener,
    private readonly trackId: string,
    private readonly language = 'de',
  ) {}

  play(lines: VoiceoverLine[], onComplete?: () => void) {
    void this.playAsync(lines, onComplete)
  }

  private async playAsync(lines: VoiceoverLine[], onComplete?: () => void) {
    this.clear()
    this.finished = false
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

    const hasMp3 = await playNovaTrackMp3(this.trackId, this.language, () => this.finish())
    const doneId = globalThis.setTimeout(
      () => this.finish(),
      (hasMp3 ? maxEnd + 4 : maxEnd) * 1000,
    )
    this.timeouts.push(doneId)
  }

  private finish() {
    if (this.finished) return
    this.finished = true
    stopNovaTrackMp3()
    for (const id of this.timeouts) globalThis.clearTimeout(id)
    this.timeouts = []
    this.emit({ type: 'subtitle_clear' })
    this.onComplete?.()
    this.onComplete = null
  }

  clear() {
    this.finished = true
    stopNovaTrackMp3()
    for (const id of this.timeouts) globalThis.clearTimeout(id)
    this.timeouts = []
    this.onComplete = null
  }
}
