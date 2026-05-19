import { z } from 'zod'

const voiceoverLineSchema = z.object({
  text: z.string(),
  at_sec: z.number(),
  pause_after_sec: z.number().optional(),
})

const timelineCueSchema = z.object({
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

export const narrativeManifestSchema = z.object({
  meta: z.object({
    persona_id: z.string(),
    language: z.string(),
    schema_version: z.string(),
  }),
  voiceover_tracks: z.record(
    z.object({
      speaker: z.string(),
      estimated_duration_sec: z.number(),
      lines: z.array(voiceoverLineSchema),
    }),
  ),
  act_scripts: z.array(
    z.object({
      act: z.number(),
      target_duration_sec: z.number(),
      ambient_audio_id: z.string().nullable().optional(),
      pre_beat_cues: z.array(timelineCueSchema),
      post_enter_cues: z.array(timelineCueSchema).optional(),
      beat_cue_templates: z.record(z.array(timelineCueSchema)).optional(),
    }),
  ),
})

export type NarrativeManifest = z.infer<typeof narrativeManifestSchema>
export type TimelineCue = z.infer<typeof timelineCueSchema>
export type VoiceoverLine = z.infer<typeof voiceoverLineSchema>
