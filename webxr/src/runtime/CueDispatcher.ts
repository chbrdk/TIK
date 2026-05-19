import type { NarrativeBeat, SceneConfig, UiOverlay } from '@/schema/scene-config'
import type { TimelineCue } from '@/schema/narrative-manifest'
import type { NarrativeListener } from './narrative-events'
import { resolveTrackLines } from './resolveVoiceoverLines'
import type { NarrativeManifest } from '@/schema/narrative-manifest'

export class CueDispatcher {
  constructor(
    private readonly emit: NarrativeListener,
    private readonly config: SceneConfig,
    private readonly manifest: NarrativeManifest | null,
    private readonly act: number,
    private readonly getOverlayForBeat: (beat: NarrativeBeat) => UiOverlay | null,
  ) {}

  dispatch(cue: TimelineCue, beat?: NarrativeBeat | null) {
    switch (cue.type) {
      case 'subtitle': {
        if (!cue.track_id) break
        const lines = resolveTrackLines(cue.track_id, this.manifest)
        if (lines.length) {
          const line = lines.find((l) => l.at_sec === cue.at_sec) ?? lines[0]
          this.emit({
            type: 'subtitle',
            text: line.text,
            trackId: cue.track_id,
            lineIndex: lines.indexOf(line),
            totalLines: lines.length,
          })
        }
        break
      }
      case 'hint_primary':
        if (cue.anchor_object) {
          this.emit({ type: 'hint', anchorId: cue.anchor_object, mode: 'primary' })
        }
        break
      case 'hint_hide':
        if (cue.anchor_object) {
          this.emit({ type: 'hint', anchorId: cue.anchor_object, mode: 'off' })
        }
        break
      case 'overlay_show': {
        let overlay = beat ? this.getOverlayForBeat(beat) : null
        if (!overlay) {
          const actBeat = this.config.narrative_beats.find(
            (b) => b.act === this.act && b.ui_overlay,
          )
          overlay = actBeat?.ui_overlay ?? null
        }
        if (overlay) {
          this.emit({
            type: 'overlay',
            overlay,
            anchorObject: overlay.anchor_object,
          })
        }
        break
      }
      case 'overlay_hide':
        this.emit({ type: 'overlay', overlay: null })
        break
      case 'chart_show':
        this.emit({
          type: 'chart_dashboard',
          visible: true,
          anchorObject: cue.anchor_object ?? 'monitor_left',
        })
        break
      case 'chart_hide':
        this.emit({
          type: 'chart_dashboard',
          visible: false,
          anchorObject: cue.anchor_object,
        })
        break
      case 'diegetic_metric':
        if (cue.metric_id && cue.animation_preset) {
          this.emit({
            type: 'diegetic',
            metricId: cue.metric_id,
            preset: cue.animation_preset,
            active: true,
          })
        }
        break
      case 'diegetic_metric_off':
        if (cue.metric_id) {
          this.emit({
            type: 'diegetic',
            metricId: cue.metric_id,
            preset: 'none',
            active: false,
          })
        }
        break
      case 'ambient':
        if (cue.ambient_audio_id && cue.action) {
          this.emit({
            type: 'ambient',
            ambientAudioId: cue.ambient_audio_id,
            action: cue.action,
          })
        }
        break
      case 'fade':
        this.emit({
          type: 'fade',
          mode: cue.mode ?? 'out',
          durationSec: cue.duration_sec ?? 0.6,
        })
        break
      case 'haptic':
        this.emit({ type: 'haptic', pattern: cue.pattern ?? 'soft_pulse' })
        break
      case 'act_advance':
        this.emit({ type: 'act_complete' })
        break
      case 'session_complete':
        this.emit({ type: 'session_complete' })
        break
      default:
        break
    }
  }
}
