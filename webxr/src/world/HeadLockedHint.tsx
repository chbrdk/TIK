import { useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'

interface Props {
  visible: boolean
  children: string
}

export function HeadLockedHint({ visible, children }: Props) {
  const rigRef = useRef<Group>(null)
  const camera = useThree((s) => s.camera)

  useFrame(() => {
    const rig = rigRef.current
    if (!rig) return
    rig.position.copy(camera.position)
    rig.quaternion.copy(camera.quaternion)
  })

  if (!visible) return null

  return (
    <group ref={rigRef}>
      <Billboard position={[0, -0.02, -0.78]}>
        <Text
          fontSize={0.045}
          color="#f5c542"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
          maxWidth={1.2}
          textAlign="center"
        >
          {children}
        </Text>
      </Billboard>
    </group>
  )
}
