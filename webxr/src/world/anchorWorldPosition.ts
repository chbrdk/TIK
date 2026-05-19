import type { AnchorDefinition } from '@/config/environments'

/** World position matching SplatWorld gameplay group (offset + uniform scale). */
export function anchorWorldPosition(
  anchor: AnchorDefinition,
  groundOffset: number,
  metricScale: number,
): [number, number, number] {
  return [
    anchor.position[0] * metricScale,
    anchor.position[1] * metricScale + groundOffset,
    anchor.position[2] * metricScale,
  ]
}
