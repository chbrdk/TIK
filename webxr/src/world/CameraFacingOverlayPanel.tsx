import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { UiOverlay } from '@/schema/scene-config'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { OverlayPanelContent } from './OverlayPanelContent'

interface FeedItem {
  headline?: string
  source?: string
}

const _offset = new THREE.Vector3(0, -0.04, -0.55)
const _worldPos = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()

interface Props {
  overlay: UiOverlay
  feedItems: FeedItem[]
  checkionMetrics: CheckionMetric[]
}

/** Desktop / non-XR: panel spawns in front of the active camera at click time, then follows view. */
export function CameraFacingOverlayPanel({ overlay, feedItems, checkionMetrics }: Props) {
  const camera = useThree((s) => s.camera)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    _offset.set(0, -0.04, -0.55)
    _offset.applyQuaternion(camera.quaternion)
    _worldPos.copy(camera.position).add(_offset)
    g.position.copy(_worldPos)
    g.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={groupRef}>
      <OverlayPanelContent
        overlay={overlay}
        feedItems={feedItems}
        checkionMetrics={checkionMetrics}
      />
    </group>
  )
}
