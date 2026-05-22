import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { InstancedMesh } from 'three'
import * as THREE from 'three'

const COUNT = 420
const SPREAD = 14

interface Props {
  active?: boolean
}

/**
 * Abstract digital void — drifting points in the background (Echeon “signal field”).
 */
export function DigitalParticleField({ active = true }: Props) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => {
    const out: { x: number; y: number; z: number; phase: number; speed: number }[] = []
    for (let i = 0; i < COUNT; i++) {
      out.push({
        x: (Math.random() - 0.5) * SPREAD,
        y: Math.random() * 6 - 1,
        z: (Math.random() - 0.5) * SPREAD - 4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.35,
      })
    }
    return out
  }, [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh || !active) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]
      const drift = Math.sin(t * s.speed + s.phase) * 0.4
      dummy.position.set(s.x + drift, s.y + Math.cos(t * 0.2 + s.phase) * 0.25, s.z + drift * 0.5)
      const scale = 0.018 + (i % 7) * 0.004
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#6eb5ff" transparent opacity={0.55} />
    </instancedMesh>
  )
}
