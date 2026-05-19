import { describe, expect, it, vi } from 'vitest'
import { VoiceoverLinePlayer, lineEndSec } from '@/runtime/VoiceoverLinePlayer'

describe('VoiceoverLinePlayer', () => {
  it('computes line end from text length', () => {
    const end = lineEndSec({ text: 'Hello world test', at_sec: 2, pause_after_sec: 0.5 })
    expect(end).toBeGreaterThan(2)
  })

  it('emits subtitle events in order', () => {
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
    vi.advanceTimersByTime(0)
    expect(events[0]).toBe('A')
    vi.advanceTimersByTime(1000)
    expect(events[1]).toBe('B')
    player.clear()
    vi.useRealTimers()
  })
})
