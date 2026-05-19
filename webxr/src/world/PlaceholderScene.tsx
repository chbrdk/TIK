import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { EnvironmentDefinition } from '@/config/environments'
import { AnchorMarkers, type HintMode } from './AnchorMarkers'
import { DiegeticMetricBadge, type DiegeticMetricData } from './DiegeticMetricBadge'
import { anchorWorldPosition } from './anchorWorldPosition'
import { LightingRig } from './LightingRig'

interface Props {
  environment: EnvironmentDefinition
  lightingPreset?: string
  highlightAnchor?: string | null
  primaryAnchorId?: string | null
  hintModes?: Record<string, HintMode>
  activeDiegetic?: { preset: string; metric: DiegeticMetricData }[]
  inVr?: boolean
  onAnchorSelect?: (id: string, world: [number, number, number]) => void
  reportQrUrl?: string | null
}

function ConstellationPoints() {
  const points = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * Math.PI * 2
      const r = 2.5 + (i % 5) * 0.35
      out.push([Math.cos(t) * r, 1.2 + Math.sin(i * 0.7) * 0.8, Math.sin(t) * r - 3])
    }
    return out
  }, [])

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#aaccff" />
        </mesh>
      ))}
    </group>
  )
}

export function PlaceholderScene({
  environment,
  lightingPreset = 'void_minimal',
  highlightAnchor,
  primaryAnchorId,
  hintModes = {},
  activeDiegetic = [],
  inVr = false,
  onAnchorSelect,
  reportQrUrl,
}: Props) {
  const variant = environment.placeholderVariant ?? 'void_mirror'
  const groundOffset = environment.semantics.ground_plane_offset
  const metricScale = environment.semantics.metric_scale_factor

  const handleAnchor = (id: string, world?: [number, number, number]) => {
    const anchor = environment.anchors.find((a) => a.id === id)
    const pos =
      world ??
      (anchor
        ? anchorWorldPosition(anchor, groundOffset, metricScale)
        : ([0, 1.2, 0] as [number, number, number]))
    onAnchorSelect?.(id, pos)
  }

  return (
    <>
      <LightingRig preset={lightingPreset} />
      {variant === 'void_mirror' && (
        <group>
          <mesh position={[0, 1.45, -2.15]} rotation={[0, 0, 0]}>
            <planeGeometry args={[1.6, 2.2]} />
            <meshStandardMaterial color="#8899bb" metalness={0.85} roughness={0.15} />
          </mesh>
          <Text position={[0, 2.35, -2.1]} fontSize={0.12} color="#c8d4ff" anchorX="center">
            Persona Reality
          </Text>
        </group>
      )}
      {variant === 'living_room' && (
        <group>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6, 6]} />
            <meshStandardMaterial color="#2a2420" />
          </mesh>
          <mesh position={[0, 0.35, -1.15]}>
            <boxGeometry args={[2.2, 0.5, 0.9]} />
            <meshStandardMaterial color="#4a4038" />
          </mesh>
          <mesh position={[-1.35, 1.35, -1.95]}>
            <boxGeometry args={[0.08, 0.6, 0.9]} />
            <meshStandardMaterial color="#5c5048" />
          </mesh>
          <pointLight position={[0.8, 2.2, 0.5]} intensity={0.6} color="#ffcba4" />
        </group>
      )}
      {variant === 'void_constellation' && (
        <group>
          <ConstellationPoints />
          {reportQrUrl && (
            <Text
              position={[0, 1.05, -1.75]}
              fontSize={0.045}
              color="#7cfac0"
              anchorX="center"
              maxWidth={1.4}
              textAlign="center"
            >
              {`Report\n${reportQrUrl.replace(/^https?:\/\//, '')}`}
            </Text>
          )}
        </group>
      )}
      {activeDiegetic.map(({ metric, preset }) => {
        const anchor = environment.anchors.find((a) => a.id === metric.anchor_object)
        if (!anchor) return null
        return (
          <DiegeticMetricBadge
            key={metric.metric_id}
            anchor={anchor}
            metric={metric}
            preset={preset}
          />
        )
      })}
      <AnchorMarkers
        anchors={environment.anchors}
        primaryAnchorId={primaryAnchorId ?? undefined}
        hintModes={hintModes}
        highlightId={highlightAnchor}
        inVr={inVr}
        onSelect={handleAnchor}
      />
    </>
  )
}
