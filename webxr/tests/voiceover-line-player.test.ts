import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { VoiceoverLinePlayer, lineEndSec } from '@/runtime/VoiceoverLinePlayer'

vi.mock('@/runtime/NovaAudioSession', () => ({
  playNovaTrackMp3: vi.fn().mockResolvedValue(true),
  stopNovaTrackMp3: vi.fn(),
}))

import { playNovaTrackMp3 } from '@/runtime/NovaAudioSession'

describe('VoiceoverLinePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('computes line end from text length', () => {
    const end = lineEndSec({ text: 'Hello world test', at_sec: 2, pause_after_sec: 0.5 })
    expect(end).toBeGreaterThan(2)
  })

  it('emits subtitle events in order', async () => {
    vi.useFakeTimers()
    const events: string[] = []
    const player = new VoiceoverLinePlayer(
      (e) => {
        if (e.type === 'subtitle') events.push(e.text)
      },
      'nova_de_act1_01',
    )
    player.play([
      { text: 'A', at_sec: 0 },
      { text: 'B', at_sec: 1 },
    ])
    await vi.advanceTimersByTimeAsync(0)
    expect(events[0]).toBe('A')
    await vi.advanceTimersByTimeAsync(1000)
    expect(events[1]).toBe('B')
    player.clear()
  })

  it('requests NOVA mp3 playback', async () => {
    vi.useFakeTimers()
    const player = new VoiceoverLinePlayer(() => {}, 'nova_de_act1_01', 'de')
    player.play([{ text: 'Hallo', at_sec: 0 }])
    await vi.advanceTimersByTimeAsync(0)
    expect(playNovaTrackMp3).toHaveBeenCalledWith('nova_de_act1_01', 'de', expect.any(Function))
    player.clear()
  })
})
