import { Line, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { pipelineRevealProgress, pipelineStagger } from './pipelineAnimation'

const DURATION_SEC = 10
const CLOUD_COUNT = 180

export interface EcheonFilterHeadline {
  headline: string
  source?: string
}

interface Props {
  headlines: EcheonFilterHeadline[]
  active: boolean
}

/**
 * Metaphor: many signals → funnel → three relevant headlines (no product name).
 */
export function EcheonFilterDiagram3d({ headlines, active }: Props) {
  const groupRef = useRef<Group>(null)
  const progressRef = useRef(0)
  const activeRef = useRef(active)
  const [reveal, setReveal] = useState(0)

  useEffect(() => {
    activeRef.current = active
    if (active) {
      progressRef.current = 0
      setReveal(0)
    }
  }, [active])

  const labels = useMemo(() => headlines.slice(0, 3), [headlines])

  const cloud = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const angle = (i / CLOUD_COUNT) * Math.PI * 2
      const r = 1.2 + Math.random() * 1.8
      pts.push([
        Math.cos(angle) * r + (Math.random() - 0.5) * 0.6,
        2.2 + Math.random() * 1.4,
        Math.sin(angle) * r * 0.4 - 0.5,
      ])
    }
    return pts
  }, [])

  useFrame((_, delta) => {
    if (!activeRef.current) return
    const next = Math.min(DURATION_SEC, progressRef.current + delta)
    progressRef.current = next
    setReveal(next)
  })

  const p = pipelineRevealProgress(reveal, DURATION_SEC)
  const funnel = Math.min(1, p * 1.4)
  const cloudOpacity = Math.max(0, 1 - funnel * 1.1)
  const labelBaseY = 0.55

  return (
    <group ref={groupRef} position={[0, 1.35, -1.2]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 48]} />
        <meshBasicMaterial color="#0a1020" transparent opacity={0.35} />
      </mesh>

      {cloud.map((pos, i) => {
        const scatter = 1 - funnel
        const x = pos[0] * scatter + (1 - scatter) * pos[0] * 0.15
        const y = pos[1] - funnel * 1.4
        const z = pos[2] * scatter
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.025, 5, 5]} />
            <meshBasicMaterial color="#88ccff" transparent opacity={cloudOpacity * 0.7} />
          </mesh>
        )
      })}

      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.55, 1.1, 16, 1, true]} />
        <meshStandardMaterial
          color="#3d6a9e"
          emissive="#2a5080"
          emissiveIntensity={0.4 * funnel}
          transparent
          opacity={0.35 + funnel * 0.45}
          wireframe
        />
      </mesh>

      {labels.map((item, i) => {
        const slot = pipelineStagger(funnel, i, labels.length)
        const x = (i - 1) * 0.95
        const y = labelBaseY - (1 - slot) * 0.8
        const text = item.headline.length > 42 ? `${item.headline.slice(0, 40)}…` : item.headline
        return (
          <group key={i} position={[x, y, 0.15]}>
            <mesh visible={slot > 0.05}>
              <planeGeometry args={[0.82, 0.22]} />
              <meshBasicMaterial color="#1a2848" transparent opacity={slot * 0.85} />
            </mesh>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.034}
              color="#e8f2ff"
              anchorX="center"
              anchorY="middle"
              maxWidth={0.78}
              textAlign="center"
              fillOpacity={slot}
            >
              {text}
            </Text>
          </group>
        )
      })}

      <Line
        points={[
          [-1.2, 2.4, 0],
          [0, 1.5, 0],
          [1.2, 2.4, 0],
        ]}
        color="#5a8fc4"
        lineWidth={1}
        transparent
        opacity={0.25 + funnel * 0.35}
      />

      <Text position={[0, 2.65, 0]} fontSize={0.05} color="#9eb8d8" anchorX="center">
        Signale
      </Text>
      <Text position={[0, 0.15, 0]} fontSize={0.045} color="#7cfac0" anchorX="center">
        Für dich
      </Text>
    </group>
  )
}
