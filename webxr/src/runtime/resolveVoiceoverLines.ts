import type { NarrativeManifest } from '@/schema/narrative-manifest'
import type { NarrativeBeat, VoiceoverLine } from '@/schema/scene-config'

export function resolveVoiceoverLines(
  beat: NarrativeBeat,
  manifest?: NarrativeManifest | null,
): VoiceoverLine[] {
  if (beat.lines?.length) return beat.lines
  const trackId = beat.voiceover_track_id
  if (!trackId || !manifest) return []
  return manifest.voiceover_tracks[trackId]?.lines ?? []
}

export function resolveTrackLines(
  trackId: string,
  manifest?: NarrativeManifest | null,
): VoiceoverLine[] {
  return manifest?.voiceover_tracks[trackId]?.lines ?? []
}
