import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { SplatMesh, SparkRenderer } from '@sparkjsdev/spark'
import type { SplatMesh as SplatMeshType } from '@sparkjsdev/spark'
import { sparkRendererOptions } from '@/config/render-quality'

const SparkRendererEl = extend(SparkRenderer)
const SplatMeshEl = extend(SplatMesh)

interface Props {
  url: string
  groundPlaneOffset?: number
  flipY?: boolean
  metricScaleFactor?: number
  /** 0–1 splat opacity (Spark SplatMesh.opacity). */
  opacity?: number
  children?: ReactNode
}

/**
 * Splat + gameplay share SparkRenderer (fusion). Splat uses flip+scale; props use
 * ground offset + metric scale only — same split as image-blaster WorldViewer.
 */
export function SplatWorld({
  url,
  groundPlaneOffset = 0,
  flipY = true,
  metricScaleFactor = 1,
  opacity = 1,
  children,
}: Props) {
  const renderer = useThree((s) => s.gl)
  const mode = useXR((s) => s.mode)
  const inVr = mode === 'immersive-vr' || mode === 'immersive-ar'
  const splatRef = useRef<SplatMeshType>(null)
  const sparkRef = useRef<SparkRenderer>(null)

  useEffect(() => {
    if (splatRef.current) splatRef.current.raycast = () => {}
    if (sparkRef.current) sparkRef.current.raycast = () => {}
  }, [])

  useFrame(() => {
    const mesh = splatRef.current
    if (!mesh) return
    mesh.opacity = opacity
  })

  const sparkArgs = useMemo(() => sparkRendererOptions(renderer, inVr), [renderer, inVr])
  const splatArgs = useMemo(() => ({ url }), [url])

  return (
    <SparkRendererEl ref={sparkRef} args={[sparkArgs]}>
      <group
        position={[0, groundPlaneOffset, 0]}
        rotation={[flipY ? Math.PI : 0, 0, 0]}
        scale={metricScaleFactor}
      >
        <SplatMeshEl ref={splatRef} args={[splatArgs]} />
      </group>
      {children && (
        <group position={[0, groundPlaneOffset, 0]} scale={metricScaleFactor}>
          {children}
        </group>
      )}
    </SparkRendererEl>
  )
}
