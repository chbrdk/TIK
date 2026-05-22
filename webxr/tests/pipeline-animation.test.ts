import { describe, expect, it } from 'vitest'
import { pipelineRevealProgress, pipelineStagger } from '@/world/pipeline/pipelineAnimation'

describe('pipelineAnimation', () => {
  it('eases progress from 0 to 1', () => {
    expect(pipelineRevealProgress(0, 10)).toBe(0)
    expect(pipelineRevealProgress(10, 10)).toBe(1)
    expect(pipelineRevealProgress(5, 10)).toBeGreaterThan(0.4)
    expect(pipelineRevealProgress(5, 10)).toBeLessThan(0.6)
  })

  it('staggers headline reveals by index', () => {
    expect(pipelineStagger(0, 0, 3)).toBe(0)
    expect(pipelineStagger(0.4, 0, 3)).toBeGreaterThan(0)
    expect(pipelineStagger(0.4, 1, 3)).toBeLessThan(pipelineStagger(0.4, 0, 3))
    expect(pipelineStagger(1, 2, 3)).toBeGreaterThan(0.99)
  })
})
