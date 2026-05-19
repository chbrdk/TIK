import type { AnchorDefinition } from '@/config/environments'

const INTERACT_RENDER = 60

interface Props {
  anchor: AnchorDefinition
  inVr?: boolean
  onActivate?: () => void
}

export function PhoneProp({ anchor, inVr = false, onActivate }: Props) {
  const scale = inVr ? 2.2 : 1
  return (
    <group position={anchor.position} rotation={[-0.3, 0.4, 0]} scale={scale}>
      <mesh
        renderOrder={INTERACT_RENDER}
        onClick={(e) => {
          e.stopPropagation()
          onActivate?.()
        }}
      >
        <boxGeometry args={[0.07, 0.14, 0.01]} />
        <meshStandardMaterial
          color="#1a1a22"
          metalness={0.6}
          roughness={0.35}
          emissive={inVr ? '#334466' : '#000000'}
          emissiveIntensity={inVr ? 0.4 : 0}
        />
      </mesh>
      <mesh position={[0, 0, 0.006]} renderOrder={INTERACT_RENDER + 1}>
        <planeGeometry args={[0.06, 0.11]} />
        <meshBasicMaterial color={inVr ? '#4a6a9a' : '#2a3a5a'} depthTest depthWrite={false} />
      </mesh>
    </group>
  )
}
