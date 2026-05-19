import { describe, expect, it } from 'vitest'
import { glbUrlFromAssetId } from '@/runtime/SceneProjectLoader'

describe('glbUrlFromAssetId', () => {
  it('maps image-blaster assetId to worlds URL', () => {
    expect(glbUrlFromAssetId('tik-kitchen-pilot/black-frying-pan/0')).toBe(
      '/worlds/tik-kitchen-pilot/output/black-frying-pan/0-black-frying-pan.glb',
    )
  })
})
