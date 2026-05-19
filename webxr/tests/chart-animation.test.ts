import { describe, expect, it } from 'vitest'
import { animatedBarHeight, easeOutCubic } from '@/world/charts/chartAnimation'

describe('chartAnimation', () => {
  it('easeOutCubic clamps and eases', () => {
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(2)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })

  it('animatedBarHeight scales with target percent', () => {
    expect(animatedBarHeight(100, 1, 0.2)).toBeCloseTo(0.2)
    expect(animatedBarHeight(50, 1, 0.2)).toBeCloseTo(0.1)
    expect(animatedBarHeight(50, 0, 0.2)).toBe(0)
  })
})
