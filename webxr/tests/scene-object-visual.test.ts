import { describe, expect, it } from 'vitest'
import { SCENE_OBJECT_SCALE } from '@/config/scene-object'
import { scaledPlacementScale } from '@/world/sceneObjectVisual'

describe('scene object visual', () => {
  it('uses image-blaster object scale', () => {
    expect(SCENE_OBJECT_SCALE).toBe(0.5)
  })

  it('scales placement tuples', () => {
    expect(scaledPlacementScale([1, 1, 1])).toEqual([0.5, 0.5, 0.5])
  })
})
