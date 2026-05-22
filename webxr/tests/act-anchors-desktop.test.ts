import { describe, expect, it } from 'vitest'
import { actInteractionHint } from '@/config/act-anchors'

describe('actInteractionHint desktop', () => {
  it('returns act 2 signal-field copy', () => {
    expect(actInteractionHint(2, true)).toContain('Signal-Feld')
    expect(actInteractionHint(2, false)).toContain('Signalfeld')
  })
})
