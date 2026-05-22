import type { NarrativeManifest } from '@/schema/narrative-manifest'
import type { NarrativeBeat, VoiceoverLine } from '@/schema/scene-config'

function linesForTrack(
  manifest: NarrativeManifest,
  trackId: string,
): VoiceoverLine[] {
  const track = manifest.voiceover_tracks[trackId]
  return track?.lines?.length ? track.lines : []
}

function trackHasLines(manifest: NarrativeManifest, trackId: string): boolean {
  return linesForTrack(manifest, trackId).length > 0
}

/** Canonical manifest + MP3 id for legacy pre_beat placeholders (e.g. schott_glasbau_act_01). */
export function resolvePlayableTrackId(
  trackId: string,
  manifest?: NarrativeManifest | null,
  actHint?: number,
): string {
  if (!manifest?.voiceover_tracks || !trackId) return trackId
  if (trackHasLines(manifest, trackId)) return trackId

  if (actHint != null) {
    for (const suffix of ['01', '02']) {
      const id = `nova_de_act${actHint}_${suffix}`
      if (trackHasLines(manifest, id)) return id
    }
  }

  const actMatch = trackId.match(/act[_-]?(\d{1,2})/i)
  if (actMatch) {
    const act = Number(actMatch[1])
    for (const suffix of ['01', '02']) {
      const id = `nova_de_act${act}_${suffix}`
      if (trackHasLines(manifest, id)) return id
    }
  }

  if (/pre_beat|voiceover/i.test(trackId) && actHint != null) {
    return `nova_de_act${actHint}_01`
  }

  return trackId
}

/** Map legacy/placeholder pre_beat track_id values to nova_de_actNN_01. */
export function resolveTrackLines(
  trackId: string,
  manifest?: NarrativeManifest | null,
  actHint?: number,
): VoiceoverLine[] {
  if (!manifest?.voiceover_tracks || !trackId) return []
  const playable = resolvePlayableTrackId(trackId, manifest, actHint)
  return linesForTrack(manifest, playable)
}

export function resolveVoiceoverLines(
  beat: NarrativeBeat,
  manifest?: NarrativeManifest | null,
  actHint?: number,
): VoiceoverLine[] {
  if (beat.lines?.length) return beat.lines
  const trackId = beat.voiceover_track_id
  if (!trackId || !manifest) return []
  return resolveTrackLines(trackId, manifest, actHint)
}
