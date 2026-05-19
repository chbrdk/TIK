import type { ReactNode } from 'react'
import type { AnchorDefinition } from '@/config/environments'

const INTERACT_RENDER = 60

interface Props {
  anchor: AnchorDefinition
  inVr?: boolean
  onActivate?: () => void
  children?: ReactNode
}

/** CHECKION dashboard target — monitor_left. */
export function MonitorProp({ anchor, inVr = false, onActivate, children }: Props) {
  const scale = inVr ? 1.4 : 1
  return (
    <group position={anchor.position} rotation={[0, 0.35, 0]} scale={scale}>
      <mesh
        renderOrder={INTERACT_RENDER}
        onClick={(e) => {
          e.stopPropagation()
          onActivate?.()
        }}
      >
        <boxGeometry args={[0.55, 0.38, 0.04]} />
        <meshStandardMaterial
          color="#1e2430"
          metalness={0.5}
          roughness={0.4}
          emissive={inVr ? '#223355' : '#000000'}
          emissiveIntensity={inVr ? 0.35 : 0}
        />
      </mesh>
      {!children && (
        <mesh position={[0, 0, 0.022]} renderOrder={INTERACT_RENDER + 1}>
          <planeGeometry args={[0.48, 0.3]} />
          <meshBasicMaterial color={inVr ? '#1a2030' : '#151a28'} depthTest depthWrite={false} />
        </mesh>
      )}
      {children}
    </group>
  )
}
