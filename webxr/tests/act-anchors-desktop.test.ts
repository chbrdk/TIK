import { describe, expect, it } from 'vitest'
import { actInteractionHint } from '@/config/act-anchors'

describe('actInteractionHint desktop', () => {
  it('returns desktop copy when desktop flag is true', () => {
    expect(actInteractionHint(2, true)).toContain('Klick')
    expect(actInteractionHint(2, false)).toContain('Handy')
  })
})
