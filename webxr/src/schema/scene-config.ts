import { z } from 'zod'

const uiOverlaySchema = z.object({
  type: z.string(),
  anchor_object: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
})

const voiceoverLineSchema = z.object({
  text: z.string(),
  at_sec: z.number(),
  pause_after_sec: z.number().optional(),
})

const beatCueSchema = z.object({
  type: z.string(),
  at_sec: z.number(),
  delay_from_beat: z.boolean().optional(),
  track_id: z.string().optional(),
  anchor_object: z.string().optional(),
  metric_id: z.string().optional(),
  animation_preset: z.string().optional(),
  ambient_audio_id: z.string().optional(),
  action: z.enum(['start', 'stop']).optional(),
  duration_sec: z.number().optional(),
  mode: z.enum(['in', 'out']).optional(),
  pattern: z.string().optional(),
})

const narrativeBeatSchema = z.object({
  act: z.number().int(),
  trigger_type: z.string(),
  trigger_target: z.string().nullable().optional(),
  delay_sec: z.number().optional(),
  duration_sec: z.number().optional(),
  voiceover_track_id: z.string().nullable().optional(),
  ambient_audio_id: z.string().nullable().optional(),
  haptic_pattern: z.string().nullable().optional(),
  ui_overlay: uiOverlaySchema.nullable().optional(),
  lines: z.array(voiceoverLineSchema).optional(),
  estimated_duration_sec: z.number().optional(),
  cues: z.array(beatCueSchema).optional(),
})

const environmentSchema = z.object({
  act: z.number().int(),
  environment_id: z.string(),
  world_slug: z.string().nullable().optional(),
  lighting_preset: z.string().optional(),
  time_of_day: z.string().optional(),
  weather: z.string().optional(),
  skybox_id: z.string().nullable().optional(),
})

export const sceneConfigSchema = z.object({
  meta: z.object({
    scene_id: z.string(),
    persona_id: z.string(),
    schema_version: z.string().optional(),
    language: z.string().optional(),
  }),
  persona: z.record(z.unknown()).optional(),
  avatar: z.record(z.unknown()).optional(),
  environments: z.array(environmentSchema),
  narrative_beats: z.array(narrativeBeatSchema),
  data_layers: z.record(z.unknown()).optional(),
  report: z
    .object({
      qr_url: z.string().optional(),
      report_id: z.string().optional(),
    })
    .optional(),
})

export type SceneConfig = z.infer<typeof sceneConfigSchema>
export type NarrativeBeat = z.infer<typeof narrativeBeatSchema>
export type EnvironmentEntry = z.infer<typeof environmentSchema>
export type UiOverlay = z.infer<typeof uiOverlaySchema>
export type VoiceoverLine = z.infer<typeof voiceoverLineSchema>
export type BeatCue = z.infer<typeof beatCueSchema>
