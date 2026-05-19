import { describe, expect, it } from 'vitest'
import { resolveEnvironmentAnchors } from '@/world/resolveEnvironmentAnchors'
import type { SceneProject } from '@/schema/scene-project'

describe('resolveEnvironmentAnchors', () => {
  it('places phone_main near microwave instance', () => {
    const anchors = resolveEnvironmentAnchors(
      [{ id: 'phone_main', position: [0, 0, 0] }],
      {
        version: 1,
        instances: [
          {
            instanceId: 'mw',
            objectId: 'mw',
            assetId: 'tik-kitchen-pilot/built-in-microwave/0',
            position: [1.2, 0.8, -1.5],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        ],
      } as SceneProject,
    )
    expect(anchors[0]?.position[0]).toBeCloseTo(1.25)
    expect(anchors[0]?.position[1]).toBeCloseTo(0.94)
    expect(anchors[0]?.position[2]).toBeCloseTo(-1.38)
  })
})
