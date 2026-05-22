import { describe, expect, it } from 'vitest'
import { resolveVoiceoverUrl } from '@/config/voiceover-audio'

describe('resolveVoiceoverUrl', () => {
  it('maps track_id to public voiceover path', () => {
    expect(resolveVoiceoverUrl('nova_de_act2_01', 'de')).toBe(
      '/voiceovers/de/nova_de_act2_01.mp3',
    )
  })

  it('returns undefined for empty track id', () => {
    expect(resolveVoiceoverUrl('', 'de')).toBeUndefined()
  })
})
