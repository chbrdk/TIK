import type { TimelineCue } from '@/schema/narrative-manifest'
import type { NarrativeBeat } from '@/schema/scene-config'
import { CueDispatcher } from './CueDispatcher'
import { VoiceoverLinePlayer } from './VoiceoverLinePlayer'
import { resolvePlayableTrackId, resolveTrackLines } from './resolveVoiceoverLines'
import type { NarrativeManifest } from '@/schema/narrative-manifest'
import type { NarrativeListener } from './narrative-events'

export class ActTimelinePlayer {
  private timeouts: ReturnType<typeof globalThis.setTimeout>[] = []
  private linePlayer: VoiceoverLinePlayer | null = null
  private beatAnchorTime = 0

  constructor(
    private readonly emit: NarrativeListener,
    private readonly dispatcher: CueDispatcher,
    private readonly manifest: NarrativeManifest | null,
    private readonly language = 'de',
  ) {}

  get beatTimeOrigin() {
    return this.beatAnchorTime
  }

  startPreBeatCues(cues: TimelineCue[]) {
    this.clear()
    const filtered = cues.filter((c) => c.type !== 'subtitle')
    this.scheduleCues(filtered, null, 0)
  }

  onBeatFired(beat: NarrativeBeat, beatCues: TimelineCue[] = []) {
    this.beatAnchorTime = performance.now()
    const rawTrackId = beat.voiceover_track_id ?? 'unknown'
    const trackId = beat.voiceover_track_id
      ? resolvePlayableTrackId(beat.voiceover_track_id, this.manifest, beat.act)
      : rawTrackId
    this.linePlayer?.clear()
    this.linePlayer = new VoiceoverLinePlayer(this.emit, trackId, this.language)

    const lines =
      beat.lines ??
      (beat.voiceover_track_id
        ? resolveTrackLines(beat.voiceover_track_id, this.manifest, beat.act)
        : [])

    if (lines.length) {
      this.linePlayer.play(lines)
    }

    const merged = [...(beat.cues ?? []), ...beatCues]
    const filtered =
      lines.length > 0 && beat.voiceover_track_id
        ? merged.filter(
            (c) =>
              c.type !== 'subtitle' ||
              !c.track_id ||
              c.track_id !== beat.voiceover_track_id,
          )
        : merged
    this.scheduleCues(filtered, beat, 0, true)
  }

  private scheduleCues(
    cues: TimelineCue[],
    beat: NarrativeBeat | null,
    offsetSec: number,
    fromBeat = false,
  ) {
    const sorted = [...cues].sort((a, b) => a.at_sec - b.at_sec)
    for (const cue of sorted) {
      const delaySec = cue.at_sec + offsetSec
      const delayMs = fromBeat && cue.delay_from_beat ? delaySec * 1000 : delaySec * 1000
      const id = globalThis.setTimeout(() => {
        this.dispatcher.dispatch(cue, beat)
      }, delayMs)
      this.timeouts.push(id)
    }
  }

  clear() {
    for (const id of this.timeouts) globalThis.clearTimeout(id)
    this.timeouts = []
    this.linePlayer?.clear()
    this.linePlayer = null
  }
}
