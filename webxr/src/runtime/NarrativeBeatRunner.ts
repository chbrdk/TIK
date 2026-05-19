import type { NarrativeBeat, SceneConfig, UiOverlay } from '@/schema/scene-config'

export type BeatListener = (event: {
  beat: NarrativeBeat
  overlay: UiOverlay | null | undefined
}) => void

export class NarrativeBeatRunner {
  private timeouts: number[] = []
  private fired = new Set<string>()

  constructor(
    private readonly config: SceneConfig,
    private readonly act: number,
    private readonly onBeat: BeatListener,
  ) {}

  start() {
    this.clear()
    for (const beat of this.config.narrative_beats.filter((b) => b.act === this.act)) {
      const key = this.beatKey(beat)
      if (beat.trigger_type === 'scene_enter' || beat.trigger_type === 'timer') {
        this.schedule(beat, (beat.delay_sec ?? 0) * 1000)
        this.fired.add(key)
      }
    }
  }

  triggerPickup(target: string) {
    this.fireTrigger('pickup', target)
  }

  triggerLookAt(target: string) {
    this.fireTrigger('look_at', target)
  }

  triggerSitDown(target: string) {
    this.fireTrigger('sit_down', target)
  }

  private fireTrigger(type: string, target: string) {
    for (const beat of this.config.narrative_beats.filter((b) => b.act === this.act)) {
      if (beat.trigger_type !== type || beat.trigger_target !== target) continue
      const key = this.beatKey(beat)
      if (this.fired.has(key)) continue
      this.fired.add(key)
      this.schedule(beat, (beat.delay_sec ?? 0) * 1000)
    }
  }

  private beatKey(beat: NarrativeBeat) {
    return `${beat.act}:${beat.trigger_type}:${beat.trigger_target ?? ''}`
  }

  private schedule(beat: NarrativeBeat, delayMs: number) {
    const id = window.setTimeout(() => {
      this.onBeat({ beat, overlay: beat.ui_overlay ?? null })
    }, delayMs)
    this.timeouts.push(id)
  }

  clear() {
    for (const id of this.timeouts) window.clearTimeout(id)
    this.timeouts = []
    this.fired.clear()
  }
}
