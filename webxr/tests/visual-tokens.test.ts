import { describe, expect, it } from 'vitest'
import { diegeticPresetStyle, trendGlyph, visualTokens } from '@/config/visual-tokens'
import { qrDataUrl } from '@/ui/qrDataUrl'

describe('visual-tokens', () => {
  it('exposes MSQDX brand colors', () => {
    expect(visualTokens.brandGreen).toBe('#00ca55')
    expect(visualTokens.brandPurple).toBe('#b638ff')
  })

  it('maps diegetic presets', () => {
    expect(diegeticPresetStyle('pulse_red').accent).toContain('ff')
    expect(diegeticPresetStyle('glow_warm').ring).toBe(visualTokens.brandGreen)
  })

  it('trend glyphs', () => {
    expect(trendGlyph('up')).toBe('↑')
    expect(trendGlyph('down')).toBe('↓')
  })
})

describe('qrDataUrl', () => {
  it('returns a PNG data URL', async () => {
    const url = await qrDataUrl('https://example.com/test')
    expect(url.startsWith('data:image/png')).toBe(true)
  })
})
