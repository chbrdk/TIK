import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { AnchorDefinition } from '@/config/environments'
import { diegeticPresetStyle } from '@/config/visual-tokens'

export interface DiegeticMetricData {
  metric_id: string
  label: string
  value: number
  unit?: string
  anchor_object: string
  animation_preset: string
}

interface Props {
  anchor: AnchorDefinition
  metric: DiegeticMetricData
  preset: string
}

export function DiegeticMetricBadge({ anchor, metric, preset }: Props) {
  const ringRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)
  const style = diegeticPresetStyle(preset)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pulse = 1 + Math.sin(t * style.pulseHz * Math.PI * 2) * style.pulseAmount
    if (ringRef.current) ringRef.current.scale.setScalar(pulse)
    if (glowRef.current) {
      const mat = glowRef.current.material as { opacity: number }
      mat.opacity = 0.25 + Math.sin(t * style.pulseHz * Math.PI * 2) * 0.15
    }
  })

  return (
    <group position={anchor.position}>
      <mesh ref={ringRef} position={[0, 0.38, 0]} renderOrder={75}>
        <ringGeometry args={[0.1, 0.13, 32]} />
        <meshBasicMaterial
          color={style.ring}
          transparent
          opacity={0.7}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 0.38, 0.001]} renderOrder={76}>
        <planeGeometry args={[0.32, 0.18]} />
        <meshBasicMaterial color={style.accent} transparent opacity={0.35} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.38, 0.002]} renderOrder={77}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshBasicMaterial color="#0a0b12" transparent opacity={0.92} depthTest={false} depthWrite={false} />
      </mesh>
      <Text
        position={[0, 0.44, 0.01]}
        fontSize={0.022}
        color="#9aa3b8"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.24}
        textAlign="center"
        renderOrder={78}
      >
        {metric.label}
      </Text>
      <Text
        position={[0, 0.36, 0.01]}
        fontSize={0.052}
        color={style.accent}
        anchorX="center"
        anchorY="middle"
        renderOrder={78}
      >
        {`${metric.value}${metric.unit ?? '%'}`}
      </Text>
    </group>
  )
}
