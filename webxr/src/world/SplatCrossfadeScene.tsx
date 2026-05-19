import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { NotInXR, XROrigin, useXR } from '@react-three/xr'
import { SparkRenderer } from '@sparkjsdev/spark'
import type { SplatMesh as SplatMeshType } from '@sparkjsdev/spark'
import type { SparkRenderer as SparkRendererType } from '@sparkjsdev/spark'
import type { Group, Object3D } from 'three'
import { sparkRendererOptions } from '@/config/render-quality'
import {
  dissolveMinAlpha,
  incomingRevealOpacity,
  incomingRevealScale,
  outgoingDissolveOpacity,
  outgoingDissolveScale,
  phaseProgress,
  splatTransition,
} from '@/config/splat-transition'
import type { ActVisualPayload } from '@/runtime/prepareActPayload'
import { createStaggerDissolveController } from './splatStaggerDissolve'
import { LightingRig } from './LightingRig'
import { PlaceholderScene } from './PlaceholderScene'

const SparkRendererEl = extend(SparkRenderer)

interface Props {
  outgoing: ActVisualPayload
  incoming: ActVisualPayload
  outgoingMesh: SplatMeshType | null
  incomingMesh: SplatMeshType | null
  onComplete: () => void
}

function splatTransform(payload: ActVisualPayload, scaleMul: number) {
  const semantics = payload.manifest.semantics ?? payload.environment.semantics
  const groundOffset = payload.sceneProject?.groundPlaneOffset ?? semantics.ground_plane_offset ?? 0
  const metricScale =
    (payload.sceneProject?.metricScaleFactor ?? semantics.metric_scale_factor ?? 1) * scaleMul
  const flipY = semantics.flip_y ?? true
  return { groundOffset, metricScale, flipY }
}

function applyGroupTransform(
  group: Group | null,
  payload: ActVisualPayload,
  scaleMul: number,
) {
  if (!group) return
  const { groundOffset, metricScale, flipY } = splatTransform(payload, scaleMul)
  group.position.set(0, groundOffset, 0)
  group.rotation.set(flipY ? Math.PI : 0, 0, 0)
  group.scale.setScalar(metricScale)
}

function setSubtreeOpacity(root: Object3D, opacity: number) {
  root.visible = opacity > 0.02
  root.traverse((child) => {
    const mesh = child as {
      material?: { transparent?: boolean; opacity?: number } | { transparent?: boolean; opacity?: number }[]
    }
    if (!mesh.material) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      if (typeof mat.opacity !== 'number') continue
      mat.transparent = true
      mat.opacity = opacity
    }
  })
}

function PlaceholderLayer({
  payload,
  groupRef,
}: {
  payload: ActVisualPayload
  groupRef: RefObject<Group | null>
}) {
  return (
    <group ref={groupRef}>
      <LightingRig preset={payload.lightingPreset} />
      <PlaceholderScene
        environment={payload.environment}
        lightingPreset={payload.lightingPreset}
        inVr={false}
      />
    </group>
  )
}

export function SplatCrossfadeScene({
  outgoing,
  incoming,
  outgoingMesh,
  incomingMesh,
  onComplete,
}: Props) {
  const renderer = useThree((s) => s.gl)
  const mode = useXR((s) => s.mode)
  const inVr = mode === 'immersive-vr' || mode === 'immersive-ar'

  const progressRef = useRef(0)
  const doneRef = useRef(false)
  const outSparkRef = useRef<SparkRendererType>(null)
  const inSparkRef = useRef<SparkRendererType>(null)
  const outGroupRef = useRef<Group>(null)
  const inGroupRef = useRef<Group>(null)
  const placeholderOutRef = useRef<Group>(null)
  const placeholderInRef = useRef<Group>(null)

  const outStagger = useMemo(() => createStaggerDissolveController('dissolve'), [])
  const inStagger = useMemo(() => createStaggerDissolveController('reveal'), [])

  const sparkArgs = useMemo(() => sparkRendererOptions(renderer, inVr), [renderer, inVr])

  useEffect(() => {
    outStagger.setSoftness(splatTransition.staggerSoftness)
    inStagger.setSoftness(splatTransition.staggerSoftness)
  }, [outStagger, inStagger])

  useEffect(() => {
    if (!outgoingMesh) return
    outStagger.attach(outgoingMesh)
    return () => outStagger.detach(outgoingMesh)
  }, [outgoingMesh, outStagger])

  useEffect(() => {
    if (!incomingMesh) return
    inStagger.attach(incomingMesh)
    return () => inStagger.detach(incomingMesh)
  }, [incomingMesh, inStagger])

  useFrame((_, delta) => {
    if (doneRef.current) return

    const durationSec = splatTransition.durationMs / 1000
    progressRef.current = Math.min(1, progressRef.current + delta / durationSec)
    const p = progressRef.current

    const dissolveP = phaseProgress(p, 0, splatTransition.dissolveEnd)
    const revealP = phaseProgress(p, splatTransition.revealStart, 1)

    const outOpacity = outgoingDissolveOpacity(p)
    const inOpacity = incomingRevealOpacity(p)
    const outScale = outgoingDissolveScale(p)
    const inScale = incomingRevealScale(p)

    if (outgoingMesh) {
      outStagger.setProgress(dissolveP)
      outgoingMesh.opacity = outOpacity
      applyGroupTransform(outGroupRef.current, outgoing, outScale)
    }
    if (incomingMesh) {
      inStagger.setProgress(revealP)
      incomingMesh.opacity = inOpacity
      applyGroupTransform(inGroupRef.current, incoming, inScale)
    }
    if (outSparkRef.current && outgoingMesh) {
      outSparkRef.current.minAlpha = dissolveMinAlpha(p)
    }
    if (!outgoingMesh && placeholderOutRef.current) {
      applyGroupTransform(placeholderOutRef.current, outgoing, outScale)
      setSubtreeOpacity(placeholderOutRef.current, outOpacity)
    }
    if (!incomingMesh && placeholderInRef.current) {
      applyGroupTransform(placeholderInRef.current, incoming, inScale)
      setSubtreeOpacity(placeholderInRef.current, inOpacity)
    }

    if (p >= 1) {
      doneRef.current = true
      onComplete()
    }
  })

  useEffect(() => {
    progressRef.current = 0
    doneRef.current = false
  }, [outgoing.act, incoming.act])

  return (
    <>
      <XROrigin position={[0, 0, 0]} />
      <NotInXR>
        <OrbitControls makeDefault target={[0, 1.2, 0]} maxPolarAngle={Math.PI * 0.85} />
      </NotInXR>
      <LightingRig preset={incoming.lightingPreset} />

      {!outgoingMesh && <PlaceholderLayer payload={outgoing} groupRef={placeholderOutRef} />}
      {!incomingMesh && <PlaceholderLayer payload={incoming} groupRef={placeholderInRef} />}

      {outgoingMesh && (
        <SparkRendererEl ref={outSparkRef} args={[sparkArgs]}>
          <group ref={outGroupRef}>
            <primitive object={outgoingMesh} />
          </group>
        </SparkRendererEl>
      )}
      {incomingMesh && (
        <SparkRendererEl ref={inSparkRef} args={[sparkArgs]}>
          <group ref={inGroupRef}>
            <primitive object={incomingMesh} />
          </group>
        </SparkRendererEl>
      )}
    </>
  )
}
