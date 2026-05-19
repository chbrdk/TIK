import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { canvasDprBounds, sparkRendererOptions } from '@/config/render-quality'

describe('render-quality', () => {
  it('canvas dpr upper bound matches env', () => {
    const [, max] = canvasDprBounds()
    expect(max).toBe(env.canvasMaxDpr)
  })

  it('desktop spark opts disable LoD when high quality', () => {
    const renderer = {} as import('three').WebGLRenderer
    const opts = sparkRendererOptions(renderer, false)
    if (env.highQualityDesktop) {
      expect(opts.enableLod).toBe(false)
      expect(opts.maxPixelRadius).toBeGreaterThanOrEqual(512)
    }
  })

  it('vr spark opts use vr pixel radius cap', () => {
    const renderer = {} as import('three').WebGLRenderer
    const opts = sparkRendererOptions(renderer, true)
    expect(opts.maxPixelRadius).toBe(env.sparkMaxPixelRadiusVr)
  })
})
