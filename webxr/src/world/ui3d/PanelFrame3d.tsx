import type { ReactNode } from 'react'

interface Props {
  width: number
  height: number
  accent: string
  renderOrder?: number
  children?: ReactNode
}

/** Dark glass panel with accent border for VR overlays. */
export function PanelFrame3d({ width, height, accent, renderOrder = 80, children }: Props) {
  const border = 0.012
  return (
    <group>
      <mesh renderOrder={renderOrder}>
        <planeGeometry args={[width + border * 2, height + border * 2]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh renderOrder={renderOrder + 1} position={[0, 0, 0.001]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#0a0b12" transparent opacity={0.96} depthTest={false} depthWrite={false} />
      </mesh>
      {children}
    </group>
  )
}
