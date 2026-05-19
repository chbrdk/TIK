import { useMemo, useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import * as THREE from 'three'
import { OVERLAY_VIEW_BLEND } from '@/config/overlay-layout'
import type { UiOverlay } from '@/schema/scene-config'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { OverlayPanelContent } from './OverlayPanelContent'

interface FeedItem {
  headline?: string
  source?: string
}

interface Props {
  targetWorld: [number, number, number]
  overlay: UiOverlay
  feedItems: FeedItem[]
  checkionMetrics: CheckionMetric[]
  reportQrUrl?: string | null
}

const _target = new THREE.Vector3()
const _pos = new THREE.Vector3()

/**
 * Panel on the line camera → hotspot, facing the user.
 */
export function BetweenViewOverlay({
  targetWorld,
  overlay,
  feedItems,
  checkionMetrics,
  reportQrUrl,
}: Props) {
  const rigRef = useRef<Group>(null)
  const camera = useThree((s) => s.camera)
  const target = useMemo(() => new THREE.Vector3(...targetWorld), [targetWorld])

  useFrame(() => {
    const rig = rigRef.current
    if (!rig) return
    _target.copy(target)
    _pos.lerpVectors(camera.position, _target, OVERLAY_VIEW_BLEND)
    rig.position.copy(_pos)
  })

  return (
    <group ref={rigRef}>
      <Billboard>
        <OverlayPanelContent
          overlay={overlay}
          feedItems={feedItems}
          checkionMetrics={checkionMetrics}
          reportQrUrl={reportQrUrl}
          faceCamera
        />
        <Text
          position={[
            0,
            overlay.type === 'dashboard' ? -0.28 : overlay.type === 'qr_code' ? -0.38 : -0.42,
            0.02,
          ]}
          fontSize={0.028}
          color="#8899aa"
          anchorX="center"
          anchorY="middle"
        >
          Grip / B-Taste = schließen
        </Text>
      </Billboard>
    </group>
  )
}
