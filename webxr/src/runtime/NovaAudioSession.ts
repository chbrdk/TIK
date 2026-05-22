import { resolveVoiceoverUrl } from '@/config/voiceover-audio'

let audioContext: AudioContext | null = null
let unlocked = false
let activeSource: AudioBufferSourceNode | null = null

/** Call from a user gesture (Enter VR, desktop start, click). */
export async function unlockNovaAudio(): Promise<void> {
  if (typeof window === 'undefined') return
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  if (!unlocked) {
    const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate)
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start(0)
    unlocked = true
  }
}

export function isNovaAudioUnlocked(): boolean {
  return unlocked && audioContext?.state === 'running'
}

export async function playNovaTrackMp3(
  trackId: string,
  language: string,
  onEnded?: () => void,
): Promise<boolean> {
  const url = resolveVoiceoverUrl(trackId, language)
  if (!url) return false

  await unlockNovaAudio()
  if (!audioContext) return false

  stopNovaTrackMp3()

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`[nova-audio] missing ${url} (${response.status})`)
      return false
    }
    const data = await response.arrayBuffer()
    const buffer = await audioContext.decodeAudioData(data.slice(0))
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.onended = () => {
      if (activeSource === source) activeSource = null
      onEnded?.()
    }
    activeSource = source
    source.start(0)
    return true
  } catch (err) {
    console.warn('[nova-audio] play failed', trackId, err)
    return false
  }
}

export function stopNovaTrackMp3() {
  if (!activeSource) return
  try {
    activeSource.stop()
  } catch {
    /* already stopped */
  }
  activeSource.onended = null
  activeSource = null
}
