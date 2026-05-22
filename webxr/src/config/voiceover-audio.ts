/**
 * NOVA ElevenLabs MP3 paths (see TIK/knowledge/repos-and-urls.md).
 * Files: webxr/public/voiceovers/<lang>/<track_id>.mp3
 */
const VOICEOVER_BASE = '/voiceovers'

export function resolveVoiceoverUrl(
  trackId: string,
  language = 'de',
): string | undefined {
  const id = trackId?.trim()
  if (!id) return undefined
  const lang = (language || 'de').trim() || 'de'
  return `${VOICEOVER_BASE}/${lang}/${id}.mp3`
}
