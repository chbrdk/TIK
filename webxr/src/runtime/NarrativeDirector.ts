import type { NarrativeManifest } from '@/schema/narrative-manifest'
import type { NarrativeBeat, SceneConfig, UiOverlay } from '@/schema/scene-config'
import { actScriptFor } from './NarrativeManifestLoader'
import { ActTimelinePlayer } from './ActTimelinePlayer'
import { BeatTriggerBridge, type BeatFireHandler } from './BeatTriggerBridge'
import { CueDispatcher } from './CueDispatcher'
import type { NarrativeListener } from './narrative-events'
import { VoiceoverLinePlayer } from './VoiceoverLinePlayer'
import { resolvePlayableTrackId, resolveTrackLines } from './resolveVoiceoverLines'

/**
 * Orchestrates pre-beat act timeline + interaction beats per act.
 */
export class NarrativeDirector {
  private bridge: BeatTriggerBridge | null = null
  private timeline: ActTimelinePlayer | null = null
  private dispatcher: CueDispatcher | null = null
  private preLinePlayer: VoiceoverLinePlayer | null = null
  private preTimeouts: ReturnType<typeof globalThis.setTimeout>[] = []
  private act = 0

  constructor(
    private readonly config: SceneConfig,
    private readonly manifest: NarrativeManifest | null,
    private readonly emit: NarrativeListener,
  ) {}

  start(act: number) {
    this.dispose()
    this.act = act

    this.dispatcher = new CueDispatcher(
      this.emit,
      this.config,
      this.manifest,
      act,
      (beat) => beat.ui_overlay ?? null,
    )
    this.timeline = new ActTimelinePlayer(
      this.emit,
      this.dispatcher,
      this.manifest,
      this.config.meta.language ?? 'de',
    )

    const script = this.manifest ? actScriptFor(this.manifest, act) : null
    const preCues = script?.pre_beat_cues ?? []
    const skipAutoTriggers = act === 1 && preCues.some((c) => c.type === 'act_advance')

    this.playPreBeatSubtitles(preCues, act)
    this.timeline.startPreBeatCues(preCues)

    this.bridge = new BeatTriggerBridge(this.config, act, this.handleBeat, {
      skipAutoTriggers,
    })
    this.bridge.start()

    if (skipAutoTriggers) {
      const enterBeat = this.config.narrative_beats.find(
        (b) => b.act === act && b.trigger_type === 'scene_enter',
      )
      if (enterBeat) {
        const delayMs = (enterBeat.delay_sec ?? 0) * 1000
        const id = globalThis.setTimeout(() => {
          this.handleBeat({ beat: enterBeat, overlay: enterBeat.ui_overlay ?? null })
        }, delayMs)
        this.preTimeouts.push(id)
      }
    }
  }

  private playPreBeatSubtitles(
    preCues: { type: string; track_id?: string; at_sec: number }[],
    act: number,
  ) {
    for (const id of this.preTimeouts) globalThis.clearTimeout(id)
    this.preTimeouts = []
    for (const cue of preCues) {
      if (cue.type !== 'subtitle' || !cue.track_id) continue
      const lines = resolveTrackLines(cue.track_id, this.manifest, act)
      if (!lines.length) continue
      const trackId = resolvePlayableTrackId(cue.track_id, this.manifest, act)
      const timeoutId = globalThis.setTimeout(() => {
        this.preLinePlayer?.clear()
        this.preLinePlayer = new VoiceoverLinePlayer(
          this.emit,
          trackId,
          this.config.meta.language ?? 'de',
        )
        this.preLinePlayer.play(lines)
      }, cue.at_sec * 1000)
      this.preTimeouts.push(timeoutId)
    }
  }

  private handleBeat: BeatFireHandler = ({ beat, overlay }) => {
    this.emit({
      type: 'beat_fired',
      beatKey: `${beat.act}:${beat.trigger_type}:${beat.trigger_target ?? ''}`,
    })
    this.timeline?.onBeatFired(beat)
    if (
      overlay &&
      !beat.cues?.some((c) => c.type === 'overlay_show' || c.type === 'chart_show')
    ) {
      this.emit({
        type: 'overlay',
        overlay,
        anchorObject: overlay.anchor_object,
      })
    }
  }

  onPickup(target: string) {
    this.bridge?.triggerPickup(target)
  }

  onLookAt(target: string) {
    this.bridge?.triggerLookAt(target)
  }

  onSitDown(target: string) {
    this.bridge?.triggerSitDown(target)
  }

  dispose() {
    this.bridge?.clear()
    this.bridge = null
    this.timeline?.clear()
    this.timeline = null
    for (const id of this.preTimeouts) globalThis.clearTimeout(id)
    this.preTimeouts = []
    this.preLinePlayer?.clear()
    this.preLinePlayer = null
    this.dispatcher = null
  }
}
