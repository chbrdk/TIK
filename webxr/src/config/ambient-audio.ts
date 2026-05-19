/** Maps scene_config ambient_audio_id → local URL (expand as SFX are synced). */
const AMBIENT_URLS: Record<string, string> = {
  kitchen_morning_loop: '/worlds/tik-kitchen-pilot/output/sfx/0-ambient-loop.mp3',
  living_evening_loop: '/worlds/tik-kitchen-pilot/output/sfx/0-ambient-loop.mp3',
}

export function resolveAmbientUrl(ambientAudioId: string | null | undefined): string | undefined {
  if (!ambientAudioId) return undefined
  return AMBIENT_URLS[ambientAudioId]
}
