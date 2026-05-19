import type { AnchorDefinition } from '@/config/environments'
import type { SceneProject } from '@/schema/scene-project'

const INSTANCE_ANCHOR_OFFSETS: Record<
  string,
  { instanceMatch: string; anchorId: string; offset: [number, number, number] }
> = {
  phone_at_microwave: {
    instanceMatch: 'built-in-microwave',
    anchorId: 'phone_main',
    offset: [0.05, 0.14, 0.12],
  },
}

/**
 * Snap narrative anchors to scene.json placements (image-blaster authored positions).
 */
export function resolveEnvironmentAnchors(
  anchors: AnchorDefinition[],
  sceneProject?: SceneProject | null,
): AnchorDefinition[] {
  if (!sceneProject?.instances.length) return anchors

  const byId = new Map(anchors.map((a) => [a.id, { ...a }]))

  for (const rule of Object.values(INSTANCE_ANCHOR_OFFSETS)) {
    const inst = sceneProject.instances.find((i) =>
      i.assetId.includes(rule.instanceMatch),
    )
    if (!inst) continue
    const anchor = byId.get(rule.anchorId)
    if (!anchor) continue
    anchor.position = [
      inst.position[0] + rule.offset[0],
      inst.position[1] + rule.offset[1],
      inst.position[2] + rule.offset[2],
    ]
  }

  return Array.from(byId.values())
}
