import { Billboard } from '@react-three/drei'
import type { AnchorDefinition } from '@/config/environments'
import type { UiOverlay } from '@/schema/scene-config'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { OverlayPanelContent } from './OverlayPanelContent'

interface FeedItem {
  headline?: string
  source?: string
}

interface Props {
  overlay: UiOverlay
  anchors: AnchorDefinition[]
  feedItems: FeedItem[]
  checkionMetrics: CheckionMetric[]
}

/** Anchor-attached fallback (editor / debug). Prefer perspective panels in VR. */
export function OverlayPanel3D({ overlay, anchors, feedItems, checkionMetrics }: Props) {
  const anchorId = overlay.anchor_object ?? anchors[0]?.id
  const anchor = anchors.find((a) => a.id === anchorId)
  if (!anchor) return null

  const pos: [number, number, number] = [
    anchor.position[0],
    anchor.position[1] + 0.22,
    anchor.position[2] - 0.08,
  ]

  return (
    <Billboard position={pos}>
      <OverlayPanelContent
        overlay={overlay}
        feedItems={feedItems}
        checkionMetrics={checkionMetrics}
      />
    </Billboard>
  )
}
