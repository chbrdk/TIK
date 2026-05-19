import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import * as THREE from 'three'
import type { AnchorDefinition } from '@/config/environments'
import { useOptionalHotspotRegistry } from './HotspotRegistry'

const HOTSPOT_RENDER = 70
const _world = new THREE.Vector3()

const LABELS: Record<string, string> = {
  phone_main: 'Handy · Trigger',
  monitor_left: 'Monitor · Trigger',
  wall_calendar: 'Kalender',
  kitchen_counter_docs: 'Dokumente',
}

export type HintMode = 'primary' | 'off' | 'default'

interface Props {
  anchors: AnchorDefinition[]
  primaryAnchorId?: string
  hintModes?: Record<string, HintMode>
  onSelect?: (id: string, world: [number, number, number]) => void
  highlightId?: string | null
  inVr?: boolean
}

function HotspotSphere({
  anchor,
  isPrimary,
  hintOff,
  highlighted,
  inVr,
  onSelect,
}: {
  anchor: AnchorDefinition
  isPrimary: boolean
  hintOff: boolean
  highlighted: boolean
  inVr: boolean
  onSelect?: (world: [number, number, number]) => void
}) {
  if (hintOff) return null
  const ringRef = useRef<Mesh>(null)
  const hitRef = useRef<Mesh>(null)
  const registry = useOptionalHotspotRegistry()
  const base = inVr ? (isPrimary ? 0.14 : 0.09) : highlighted ? 0.08 : isPrimary ? 0.07 : 0.05
  const hitRadius = inVr ? base * 2.2 : base * 1.4

  useEffect(() => {
    const mesh = hitRef.current
    if (!mesh || !registry) return
    registry.register(anchor.id, mesh)
    return () => registry.unregister(anchor.id)
  }, [anchor.id, registry])

  const activate = () => {
    const mesh = hitRef.current
    if (!mesh) return
    mesh.getWorldPosition(_world)
    onSelect?.([_world.x, _world.y, _world.z])
  }

  useFrame(({ clock }) => {
    if (!ringRef.current || !inVr || !isPrimary) return
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.12
    ringRef.current.scale.setScalar(s)
  })

  return (
    <group position={anchor.position}>
      {inVr && isPrimary && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={HOTSPOT_RENDER}>
          <ringGeometry args={[base * 1.4, base * 1.7, 32]} />
          <meshBasicMaterial
            color="#f5c542"
            transparent
            opacity={0.55}
            side={2}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      <mesh
        ref={hitRef}
        renderOrder={HOTSPOT_RENDER + 1}
        onClick={(e) => {
          e.stopPropagation()
          activate()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          activate()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[hitRadius, 24, 24]} />
        <meshBasicMaterial
          color={highlighted ? '#7cfac0' : isPrimary ? '#f5c542' : '#88aaff'}
          transparent
          opacity={inVr ? 0.55 : 0.85}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={HOTSPOT_RENDER + 2}>
        <sphereGeometry args={[base, 24, 24]} />
        <meshBasicMaterial
          color={highlighted ? '#7cfac0' : isPrimary ? '#f5c542' : '#88aaff'}
          transparent
          opacity={inVr ? 0.95 : 0.85}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {inVr && (
        <Billboard position={[0, base + 0.12, 0]}>
          <Text
            fontSize={0.07}
            color={isPrimary ? '#f5c542' : '#c8d0e0'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.004}
            outlineColor="#000000"
          >
            {LABELS[anchor.id] ?? anchor.id}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

export function AnchorMarkers({
  anchors,
  primaryAnchorId,
  hintModes = {},
  onSelect,
  highlightId,
  inVr,
}: Props) {
  return (
    <group>
      {anchors.map((anchor) => {
        const mode = hintModes[anchor.id] ?? 'default'
        const isPrimary = mode === 'primary' || anchor.id === primaryAnchorId
        return (
          <HotspotSphere
            key={anchor.id}
            anchor={anchor}
            isPrimary={isPrimary}
            hintOff={mode === 'off'}
            highlighted={highlightId === anchor.id}
            inVr={inVr ?? false}
            onSelect={(world) => onSelect?.(anchor.id, world)}
          />
        )
      })}
    </group>
  )
}
