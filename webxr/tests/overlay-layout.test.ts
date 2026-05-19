import { describe, expect, it } from 'vitest'
import { OVERLAY_VIEW_BLEND } from '@/config/overlay-layout'
import { anchorWorldPosition } from '@/world/anchorWorldPosition'

describe('overlay layout', () => {
  it('blends between viewer and hotspot', () => {
    expect(OVERLAY_VIEW_BLEND).toBeGreaterThan(0.2)
    expect(OVERLAY_VIEW_BLEND).toBeLessThan(0.8)
  })

  it('maps anchor into gameplay world space', () => {
    const p = anchorWorldPosition({ id: 'x', position: [1, 1, 2] }, 1.2, 0.9)
    expect(p[1]).toBeCloseTo(2.1, 1)
    expect(p[0]).toBeCloseTo(0.9, 1)
  })
})
