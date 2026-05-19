import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  useXR,
  useXRControllerButtonEvent,
  useXRInputSourceEvent,
  useXRInputSourceState,
} from '@react-three/xr'
import * as THREE from 'three'
import { useOptionalHotspotRegistry } from './HotspotRegistry'

const _origin = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _raycaster = new THREE.Raycaster()

export type HotspotHit = {
  anchorId: string
  world: [number, number, number]
}

interface Props {
  enabled: boolean
  onHit: (hit: HotspotHit) => void
}

/**
 * Quest: ray-select via WebXR `select` + trigger; returns world hit point on the sphere.
 */
export function VrHotspotInteractor({ enabled, onHit }: Props) {
  const registry = useOptionalHotspotRegistry()
  const originReferenceSpace = useXR((s) => s.originReferenceSpace)
  const right = useXRInputSourceState('controller', 'right')
  const left = useXRInputSourceState('controller', 'left')
  const controller = right ?? left
  const pendingRef = useRef(false)

  const castFromInput = (inputSource: XRInputSource | undefined, frame: XRFrame | undefined) => {
    if (!enabled || !registry || !inputSource || !frame || !originReferenceSpace) return
    const pose = frame.getPose(inputSource.targetRaySpace, originReferenceSpace)
    if (!pose) return

    const { x, y, z } = pose.transform.position
    const o = pose.transform.orientation
    _origin.set(x, y, z)
    _quat.set(o.x, o.y, o.z, o.w)
    _dir.set(0, 0, -1).applyQuaternion(_quat).normalize()
    _raycaster.set(_origin, _dir)
    _raycaster.far = 12
    _raycaster.near = 0.02

    const hits = _raycaster.intersectObjects(registry.targets(), false)
    const hit = hits[0]
    const id = hit?.object.userData.hotspotId as string | undefined
    if (!id || !hit) return
    const p = hit.point
    onHit({ anchorId: id, world: [p.x, p.y, p.z] })
  }

  useXRInputSourceEvent(
    'all',
    'select',
    (event) => {
      castFromInput(event.inputSource, event.frame)
    },
    [enabled, registry, originReferenceSpace, onHit],
  )

  useXRControllerButtonEvent(controller, 'xr-standard-trigger', (state) => {
    if (state === 'pressed') pendingRef.current = true
  })
  useXRControllerButtonEvent(controller, 'xr-standard-squeeze', (state) => {
    if (state === 'pressed') pendingRef.current = true
  })

  useFrame((_, __, frame) => {
    if (!pendingRef.current || !controller?.inputSource) return
    pendingRef.current = false
    castFromInput(controller.inputSource, frame as XRFrame | undefined)
  })

  return null
}
