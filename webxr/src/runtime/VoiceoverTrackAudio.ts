import { playNovaTrackMp3, stopNovaTrackMp3 } from './NovaAudioSession'

/** Plays one full NOVA track MP3 (ElevenLabs export) via Web Audio API. */
export class VoiceoverTrackAudio {
  play(trackId: string, language: string, onEnded?: () => void): boolean {
    void playNovaTrackMp3(trackId, language, onEnded).then((ok) => {
      if (!ok) onEnded?.()
    })
    return true
  }

  stop() {
    stopNovaTrackMp3()
  }

  get isPlaying(): boolean {
    return false
  }
}
