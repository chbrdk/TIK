import { describe, expect, it } from 'vitest'
import {
  dissolveMinAlpha,
  easeInOutCubic,
  incomingRevealOpacity,
  incomingRevealScale,
  outgoingDissolveOpacity,
  outgoingDissolveScale,
  phaseProgress,
  splatTransition,
} from '@/config/splat-transition'

describe('splat-transition easing', () => {
  it('easeInOutCubic is 0 at 0 and 1 at 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('phaseProgress maps window', () => {
    expect(phaseProgress(0, 0.2, 0.8)).toBe(0)
    expect(phaseProgress(1, 0.2, 0.8)).toBe(1)
    expect(phaseProgress(0.5, 0.2, 0.8)).toBeCloseTo(0.5, 1)
  })

  it('outgoing opacity mostly fades in dissolve phase', () => {
    expect(outgoingDissolveOpacity(0)).toBe(1)
    expect(outgoingDissolveOpacity(splatTransition.dissolveEnd)).toBeLessThan(0.85)
  })

  it('incoming opacity rises in reveal phase', () => {
    expect(incomingRevealOpacity(splatTransition.revealStart)).toBeLessThan(1)
    expect(incomingRevealOpacity(1)).toBe(1)
  })

  it('outgoing scale grows, incoming scale settles', () => {
    expect(outgoingDissolveScale(0)).toBeCloseTo(1, 5)
    expect(outgoingDissolveScale(splatTransition.dissolveEnd)).toBeGreaterThan(1)
    expect(incomingRevealScale(splatTransition.revealStart)).toBeGreaterThan(1)
    expect(incomingRevealScale(1)).toBeCloseTo(1, 5)
  })

  it('dissolve minAlpha rises during dissolve phase', () => {
    expect(dissolveMinAlpha(0)).toBeLessThan(dissolveMinAlpha(splatTransition.dissolveEnd))
  })
})
