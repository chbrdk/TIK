import type { UiOverlay } from '@/schema/scene-config'

export type NarrativeEvent =
  | {
      type: 'subtitle'
      text: string
      trackId: string
      lineIndex: number
      totalLines: number
    }
  | { type: 'subtitle_clear' }
  | { type: 'overlay'; overlay: UiOverlay | null; anchorObject?: string }
  | {
      type: 'chart_dashboard'
      visible: boolean
      anchorObject?: string
    }
  | {
      type: 'pipeline_diagram'
      layer: 'echeon' | 'audion' | 'checkion' | 'cms'
      active: boolean
      anchorObject?: string
    }
  | {
      type: 'diegetic'
      metricId: string
      preset: string
      active: boolean
    }
  | { type: 'hint'; anchorId: string; mode: 'primary' | 'off' | 'default' }
  | { type: 'ambient'; ambientAudioId: string; action: 'start' | 'stop' }
  | { type: 'fade'; mode: 'in' | 'out'; durationSec: number }
  | { type: 'haptic'; pattern: string }
  | { type: 'act_complete' }
  | { type: 'session_complete' }
  | { type: 'beat_fired'; beatKey: string }

export type NarrativeListener = (event: NarrativeEvent) => void
