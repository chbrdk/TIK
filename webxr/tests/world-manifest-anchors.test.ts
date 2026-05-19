import { describe, expect, it } from 'vitest'
import { mergeManifestAnchors } from '@/runtime/WorldManifestLoader'
import type { EnvironmentDefinition } from '@/config/environments'
import type { WorldManifest } from '@/schema/world-manifest'

describe('mergeManifestAnchors', () => {
  it('overrides registry positions from manifest anchors', () => {
    const envDef: EnvironmentDefinition = {
      environmentId: 'env_kitchen_lived_in_dach_v1',
      defaultAct: 2,
      kind: 'splat',
      worldSlug: 'schott-act2-kitchen',
      displayName: 'Küche',
      anchors: [
        { id: 'phone_main', position: [0, 0, 0] },
        { id: 'wall_calendar', position: [0, 0, 0] },
      ],
      semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: true },
    }
    const manifest: WorldManifest = {
      slug: 'schott-act2-kitchen',
      environment_id: 'env_kitchen_lived_in_dach_v1',
      splat_url: '/worlds/schott-act2-kitchen/splat.spz',
      anchors: [{ id: 'phone_main', position: [1.15, 0.95, -1.35] }],
    }
    const merged = mergeManifestAnchors(envDef, manifest)
    expect(merged.anchors.find((a) => a.id === 'phone_main')?.position).toEqual([
      1.15, 0.95, -1.35,
    ])
  })
})
