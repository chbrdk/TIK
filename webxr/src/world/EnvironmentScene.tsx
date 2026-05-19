import { Suspense, useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { NotInXR, XROrigin, useXR } from '@react-three/xr'
import { primaryAnchorForAct } from '@/config/act-anchors'
import type { EnvironmentDefinition } from '@/config/environments'
import type { WorldManifest } from '@/schema/world-manifest'
import type { SceneProject } from '@/schema/scene-project'
import type { UiOverlay } from '@/schema/scene-config'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { SplatWorld } from './SplatWorld'
import { PlaceholderScene } from './PlaceholderScene'
import { AnchorMarkers } from './AnchorMarkers'
import { anchorWorldPosition } from './anchorWorldPosition'
import { BetweenViewOverlay } from './BetweenViewOverlay'
import { HotspotRegistryProvider } from './HotspotRegistry'
import { VrHotspotInteractor } from './VrHotspotInteractor'
import { VrOverlayDismiss } from './VrOverlayDismiss'
import { HeadLockedHint } from './HeadLockedHint'
import { resolveEnvironmentAnchors } from './resolveEnvironmentAnchors'
import { ScenePlacements } from './ScenePlacements'
import { LightingRig } from './LightingRig'
import { PhoneProp } from './PhoneProp'
import { MonitorProp } from './MonitorProp'
import { CheckionMonitorDashboard3d } from './charts/CheckionMonitorDashboard3d'
import { DiegeticMetricBadge, type DiegeticMetricData } from './DiegeticMetricBadge'
import type { HintMode } from './AnchorMarkers'

interface FeedItem {
  headline?: string
  source?: string
}

interface Props {
  act: number
  environment: EnvironmentDefinition
  manifest: WorldManifest
  sceneProject?: SceneProject | null
  lightingPreset?: string
  showProps?: boolean
  highlightAnchor?: string | null
  hintModes?: Record<string, HintMode>
  activeDiegetic?: { preset: string; metric: DiegeticMetricData }[]
  onAnchorSelect?: (id: string, world: [number, number, number]) => void
  onDismissOverlay?: () => void
  overlay?: UiOverlay | null
  overlayFocusWorld?: [number, number, number] | null
  feedItems?: FeedItem[]
  checkionMetrics?: CheckionMetric[]
  monitorChartVisible?: boolean
  reportQrUrl?: string | null
}

export function EnvironmentScene({
  act,
  environment,
  manifest,
  sceneProject,
  lightingPreset = 'midday_neutral',
  showProps = true,
  highlightAnchor,
  hintModes = {},
  activeDiegetic = [],
  onAnchorSelect,
  onDismissOverlay,
  overlay,
  overlayFocusWorld,
  feedItems = [],
  checkionMetrics = [],
  monitorChartVisible = false,
  reportQrUrl,
}: Props) {
  const mode = useXR((s) => s.mode)
  const inVr = mode === 'immersive-vr' || mode === 'immersive-ar'
  const isPlaceholder = environment.kind === 'placeholder'

  const semantics = manifest.semantics ?? environment.semantics
  const groundOffset = sceneProject?.groundPlaneOffset ?? semantics.ground_plane_offset ?? 0
  const metricScale = sceneProject?.metricScaleFactor ?? semantics.metric_scale_factor ?? 1
  const flipY = semantics.flip_y ?? true

  const anchors = useMemo(
    () => resolveEnvironmentAnchors(environment.anchors, sceneProject),
    [environment.anchors, sceneProject],
  )

  const phoneAnchor = anchors.find((a) => a.id === 'phone_main')
  const monitorAnchor = anchors.find((a) => a.id === 'monitor_left')
  const primaryAnchor = primaryAnchorForAct(act)
  const orbitTarget = useMemo((): [number, number, number] => {
    if (act === 3 && monitorAnchor) {
      return anchorWorldPosition(monitorAnchor, groundOffset, metricScale)
    }
    return [0, 1.2, 0]
  }, [act, monitorAnchor, groundOffset, metricScale])
  const monitorWorld = monitorAnchor
    ? anchorWorldPosition(monitorAnchor, groundOffset, metricScale)
    : null

  const resolveWorld = (id: string, world?: [number, number, number]) => {
    if (world) return world
    const anchor = anchors.find((a) => a.id === id)
    if (!anchor) return [0, 1.2, 0] as [number, number, number]
    return anchorWorldPosition(anchor, groundOffset, metricScale)
  }

  const handleAnchor = (id: string, world?: [number, number, number]) => {
    onAnchorSelect?.(id, resolveWorld(id, world))
  }

  const overlayLayer =
    overlay && overlayFocusWorld ? (
      <BetweenViewOverlay
        targetWorld={overlayFocusWorld}
        overlay={overlay}
        feedItems={feedItems}
        checkionMetrics={checkionMetrics}
        reportQrUrl={reportQrUrl}
      />
    ) : null

  if (isPlaceholder) {
    return (
      <>
        <XROrigin position={[0, 0, 0]} />
        {inVr && overlayLayer}
        {inVr && overlay && onDismissOverlay && (
          <VrOverlayDismiss enabled onDismiss={onDismissOverlay} />
        )}
        {inVr && !overlay && (
          <HeadLockedHint visible>
            Kugel anvisieren + Trigger · Grip schließt Panel
          </HeadLockedHint>
        )}
        <NotInXR>
          <OrbitControls makeDefault target={[0, 1.2, -1.5]} maxPolarAngle={Math.PI * 0.85} />
          {!inVr && overlayLayer}
        </NotInXR>
        <HotspotRegistryProvider>
          <VrHotspotInteractor
            enabled={inVr}
            onHit={({ anchorId, world }) => handleAnchor(anchorId, world)}
          />
          <PlaceholderScene
            environment={environment}
            lightingPreset={lightingPreset}
            highlightAnchor={highlightAnchor}
            primaryAnchorId={primaryAnchor}
            hintModes={hintModes}
            activeDiegetic={activeDiegetic}
            inVr={inVr}
            onAnchorSelect={handleAnchor}
            reportQrUrl={reportQrUrl}
          />
        </HotspotRegistryProvider>
      </>
    )
  }

  return (
    <>
      <XROrigin position={[0, 0, 0]} />
      {inVr && overlayLayer}
      {inVr && overlay && onDismissOverlay && (
        <VrOverlayDismiss enabled onDismiss={onDismissOverlay} />
      )}
      {inVr && !overlay && (
        <HeadLockedHint visible>
          Kugel anvisieren + Trigger · Grip schließt Panel
        </HeadLockedHint>
      )}
      <NotInXR>
        <OrbitControls makeDefault target={orbitTarget} maxPolarAngle={Math.PI * 0.85} />
        {!inVr && overlayLayer}
      </NotInXR>
      <LightingRig preset={lightingPreset} />
      <HotspotRegistryProvider>
        <VrHotspotInteractor
          enabled={inVr}
          onHit={({ anchorId, world }) => handleAnchor(anchorId, world)}
        />
        <Suspense fallback={null}>
          <SplatWorld
            url={manifest.splat_url}
            groundPlaneOffset={groundOffset}
            flipY={flipY}
            metricScaleFactor={metricScale}
          >
            {showProps && sceneProject && <ScenePlacements project={sceneProject} />}
            {phoneAnchor && (
              <PhoneProp
                anchor={phoneAnchor}
                inVr={inVr}
                onActivate={() =>
                  handleAnchor(
                    'phone_main',
                    anchorWorldPosition(phoneAnchor, groundOffset, metricScale),
                  )
                }
              />
            )}
            {monitorAnchor && (
              <MonitorProp
                anchor={monitorAnchor}
                inVr={inVr}
                onActivate={() =>
                  handleAnchor(
                    'monitor_left',
                    anchorWorldPosition(monitorAnchor, groundOffset, metricScale),
                  )
                }
              >
                {act === 3 && monitorChartVisible && checkionMetrics.length > 0 && (
                  <CheckionMonitorDashboard3d metrics={checkionMetrics} active />
                )}
              </MonitorProp>
            )}
            {activeDiegetic.map(({ metric, preset }) => {
              const anchor = anchors.find((a) => a.id === metric.anchor_object)
              if (!anchor) return null
              return (
                <DiegeticMetricBadge
                  key={metric.metric_id}
                  anchor={anchor}
                  metric={metric}
                  preset={preset}
                />
              )
            })}
            <AnchorMarkers
              anchors={anchors}
              primaryAnchorId={primaryAnchor ?? undefined}
              hintModes={hintModes}
              highlightId={highlightAnchor}
              inVr={inVr}
              onSelect={handleAnchor}
            />
          </SplatWorld>
        </Suspense>
      </HotspotRegistryProvider>
    </>
  )
}
