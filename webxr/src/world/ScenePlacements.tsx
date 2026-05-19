import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { env } from '@/config/env'
import { glbUrlFromAssetId } from '@/runtime/SceneProjectLoader'
import type { SceneProject } from '@/schema/scene-project'
import { footPivotOffset, scaledPlacementScale } from './sceneObjectVisual'

const PROP_RENDER = 55

function PlacementModel({
  url,
  position,
  rotation,
  scale,
}: {
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}) {
  const { scene } = useGLTF(url)
  const { clone, pivot } = useMemo(() => {
    const c = scene.clone()
    return { clone: c, pivot: footPivotOffset(c) }
  }, [scene])

  return (
    <group position={position} rotation={rotation}>
      <group scale={scaledPlacementScale(scale)} position={pivot}>
        <primitive object={clone} renderOrder={PROP_RENDER} />
      </group>
    </group>
  )
}

function PlacementFallback({
  position,
  fallbackColor,
}: {
  position: [number, number, number]
  fallbackColor: string
}) {
  return (
    <mesh position={position} renderOrder={PROP_RENDER}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial color={fallbackColor} emissive={fallbackColor} emissiveIntensity={0.35} />
    </mesh>
  )
}

interface BoundaryProps {
  url: string
  position: [number, number, number]
  children: ReactNode
}

interface BoundaryState {
  failed: boolean
}

class PlacementErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(err: unknown) {
    console.warn('[ScenePlacements] GLB failed:', this.props.url, err)
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (prev.url !== this.props.url && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) {
      return <PlacementFallback position={this.props.position} fallbackColor="#c44" />
    }
    return this.props.children
  }
}

interface Props {
  project: SceneProject
}

export function ScenePlacements({ project }: Props) {
  const instances = project.instances.slice(0, env.maxSceneProps)

  return (
    <group>
      {instances.map((inst, i) => {
        const url = glbUrlFromAssetId(inst.assetId)
        return (
          <PlacementErrorBoundary key={inst.instanceId} url={url} position={inst.position}>
            <Suspense
              fallback={
                <PlacementFallback
                  position={inst.position}
                  fallbackColor={i % 2 === 0 ? '#4a8' : '#48a'}
                />
              }
            >
              <PlacementModel
                url={url}
                position={inst.position}
                rotation={inst.rotation}
                scale={inst.scale}
              />
            </Suspense>
          </PlacementErrorBoundary>
        )
      })}
    </group>
  )
}
