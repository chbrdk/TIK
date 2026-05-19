import { Text } from '@react-three/drei'
import { trendGlyph } from '@/config/visual-tokens'

interface Props {
  label: string
  value: number
  unit?: string
  trend?: string
  x: number
  y: number
  accent: string
  renderOrder: number
}

export function MetricBar3d({ label, value, unit, trend, x, y, accent, renderOrder }: Props) {
  const pct = Math.max(0, Math.min(100, value)) / 100
  const barW = 0.14
  const barH = 0.018

  return (
    <group position={[x, y, 0]}>
      <Text
        position={[0, 0.055, 0.01]}
        fontSize={0.022}
        color="#9aa3b8"
        anchorX="center"
        anchorY="middle"
        renderOrder={renderOrder + 2}
      >
        {label}
      </Text>
      <Text
        position={[0, 0.02, 0.01]}
        fontSize={0.034}
        color={accent}
        anchorX="center"
        anchorY="middle"
        renderOrder={renderOrder + 2}
      >
        {`${value}${unit ?? ''} ${trendGlyph(trend)}`}
      </Text>
      <mesh position={[0, -0.02, 0.005]} renderOrder={renderOrder + 1}>
        <planeGeometry args={[barW, barH]} />
        <meshBasicMaterial color="#1e2430" depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[-(barW * (1 - pct)) / 2, -0.02, 0.006]} renderOrder={renderOrder + 2}>
        <planeGeometry args={[barW * pct, barH]} />
        <meshBasicMaterial color={accent} transparent opacity={0.9} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
