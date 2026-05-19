import { Canvas, useFrame } from '@react-three/fiber'
import { XR } from '@react-three/xr'
import { useCallback, useEffect, useRef, useState } from 'react'
import { actInteractionHint, primaryAnchorForAct } from '@/config/act-anchors'
import { sceneProjectUrl, type EnvironmentDefinition } from '@/config/environments'
import { ActDirector } from '@/runtime/ActDirector'
import { loadSceneConfig, environmentForAct } from '@/runtime/SceneConfigLoader'
import { loadWorldManifestForEnvironment } from '@/runtime/WorldManifestLoader'
import { loadSceneProjectForSlug, glbUrlFromAssetId } from '@/runtime/SceneProjectLoader'
import { CompanionBridge } from '@/runtime/CompanionBridge'
import { precacheUrls } from '@/runtime/AssetPrecache'
import { AmbientAudio } from '@/runtime/AmbientAudio'
import { QuestMetrics } from '@/runtime/QuestMetrics'
import { resolveAmbientUrl } from '@/config/ambient-audio'
import { env, DESKTOP_PREVIEW_STORAGE_KEY } from '@/config/env'
import { canvasDprBounds } from '@/config/render-quality'
import { useDesktopSession } from '@/runtime/useDesktopSession'
import { resolveEnvironmentForAct, splatActsFromConfig } from '@/runtime/resolveEnvironment'
import { SessionFlow } from '@/runtime/SessionFlow'
import { NarrativeDirector } from '@/runtime/NarrativeDirector'
import { loadNarrativeManifest } from '@/runtime/NarrativeManifestLoader'
import type { NarrativeEvent } from '@/runtime/narrative-events'
import type { NarrativeManifest } from '@/schema/narrative-manifest'
import type { SceneConfig, UiOverlay } from '@/schema/scene-config'
import type { WorldManifest } from '@/schema/world-manifest'
import type { SceneProject } from '@/schema/scene-project'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { EnvironmentScene } from '@/world/EnvironmentScene'
import { SplatCrossfadeScene } from '@/world/SplatCrossfadeScene'
import { prepareActPayload, type ActVisualPayload } from '@/runtime/prepareActPayload'
import { anchorWorldPosition } from '@/world/anchorWorldPosition'
import { createReadySplatMesh, disposeSplatMesh } from '@/runtime/readySplatMesh'
import type { SplatMesh } from '@sparkjsdev/spark'
import { OverlayPanel } from '@/ui/OverlayPanel'
import { NovaSubtitle } from '@/ui/NovaSubtitle'
import { Hud } from '@/ui/Hud'
import { VrEntryScreen } from '@/ui/VrEntryScreen'
import { DesktopHelpBar } from '@/ui/DesktopHelpBar'
import { ActTransition } from '@/ui/ActTransition'
import type { DiegeticMetricData } from '@/world/DiegeticMetricBadge'
import type { HintMode } from '@/world/AnchorMarkers'
import { xrStore } from '@/xr/store'
import { VrRenderQuality } from '@/xr/VrRenderQuality'
import '@/index.css'

interface FeedItem {
  headline?: string
  source?: string
  relevance_score?: number
}

function FpsCounter({
  onFps,
  metrics,
}: {
  onFps: (fps: number) => void
  metrics: QuestMetrics
}) {
  const frames = useRef(0)
  const last = useRef(performance.now())
  useFrame(() => {
    frames.current += 1
    const now = performance.now()
    if (now - last.current >= 1000) {
      const fps = frames.current
      onFps(fps)
      metrics.record(fps)
      frames.current = 0
      last.current = now
    }
  })
  return null
}

export function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<SceneConfig | null>(null)
  const [narrativeManifest, setNarrativeManifest] = useState<NarrativeManifest | null>(null)
  const [currentAct, setCurrentAct] = useState<number>(SessionFlow.firstAct())
  const [environment, setEnvironment] = useState<EnvironmentDefinition | null>(null)
  const [manifest, setManifest] = useState<WorldManifest | null>(null)
  const [sceneProject, setSceneProject] = useState<SceneProject | null>(null)
  const [overlay, setOverlay] = useState<UiOverlay | null>(null)
  const [overlayFocusWorld, setOverlayFocusWorld] = useState<[number, number, number] | null>(
    null,
  )
  const [monitorChartVisible, setMonitorChartVisible] = useState(false)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [checkionMetrics, setCheckionMetrics] = useState<CheckionMetric[]>([])
  const [subtitle, setSubtitle] = useState<{
    text: string
    trackId: string
    lineIndex: number
    totalLines: number
  } | null>(null)
  const [highlightAnchor, setHighlightAnchor] = useState<string | null>(null)
  const [hintModes, setHintModes] = useState<Record<string, HintMode>>({})
  const [activeDiegetic, setActiveDiegetic] = useState<
    Record<string, { preset: string; metric: DiegeticMetricData }>
  >({})
  const [fps, setFps] = useState<number | undefined>()
  const [vrSupported, setVrSupported] = useState(false)
  const [inVr, setInVr] = useState(false)
  const [showProps, setShowProps] = useState(env.showSceneProps)
  const [wsStatus, setWsStatus] = useState('off')
  const [precacheStatus, setPrecacheStatus] = useState('')
  const [vrError, setVrError] = useState<string | null>(null)
  const [vrEntering, setVrEntering] = useState(false)
  const [desktopPreview, setDesktopPreview] = useState(() => {
    if (typeof localStorage === 'undefined') return env.desktopPreview
    const stored = localStorage.getItem(DESKTOP_PREVIEW_STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
    return env.desktopPreview
  })
  const [desktopHelpCollapsed, setDesktopHelpCollapsed] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [crossfade, setCrossfade] = useState<{
    outgoing: ActVisualPayload
    incoming: ActVisualPayload
    outgoingMesh: SplatMesh | null
    incomingMesh: SplatMesh | null
  } | null>(null)
  const crossfadeMeshesRef = useRef<{ out: SplatMesh | null; in: SplatMesh | null }>({
    out: null,
    in: null,
  })
  const crossfadeResolveRef = useRef<(() => void) | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const directorRef = useRef<ActDirector | null>(null)
  const narrativeRef = useRef<NarrativeDirector | null>(null)
  const sessionFlowRef = useRef<SessionFlow | null>(null)
  const ambientRef = useRef(new AmbientAudio())
  const metricsRef = useRef(new QuestMetrics())
  const bridgeRef = useRef<CompanionBridge | null>(null)
  const configRef = useRef<SceneConfig | null>(null)
  const manifestRef = useRef<NarrativeManifest | null>(null)
  const environmentRef = useRef<EnvironmentDefinition | null>(null)
  const diegeticCatalogRef = useRef<DiegeticMetricData[]>([])
  const currentActRef = useRef(currentAct)

  useEffect(() => {
    currentActRef.current = currentAct
  }, [currentAct])

  useEffect(() => {
    environmentRef.current = environment
  }, [environment])

  const resolveOverlayFocus = useCallback((anchorId?: string) => {
    if (!anchorId) return
    const anchor = environmentRef.current?.anchors.find((a) => a.id === anchorId)
    if (anchor) setOverlayFocusWorld(anchor.position)
  }, [])

  const handleNarrativeEvent = useCallback(
    async (event: NarrativeEvent) => {
      sessionFlowRef.current?.listener(event)

      switch (event.type) {
        case 'subtitle':
          setSubtitle({
            text: event.text,
            trackId: event.trackId,
            lineIndex: event.lineIndex,
            totalLines: event.totalLines,
          })
          break
        case 'subtitle_clear':
          setSubtitle(null)
          break
        case 'overlay':
          setOverlay(event.overlay)
          if (event.overlay?.anchor_object) {
            setHighlightAnchor(event.overlay.anchor_object)
            resolveOverlayFocus(event.overlay.anchor_object)
          } else {
            setOverlayFocusWorld(null)
          }
          break
        case 'chart_dashboard':
          setMonitorChartVisible(event.visible)
          if (event.visible) {
            setOverlay(null)
          }
          if (event.visible && event.anchorObject) {
            setHighlightAnchor(event.anchorObject)
            resolveOverlayFocus(event.anchorObject)
          }
          if (!event.visible) {
            setOverlay(null)
            setOverlayFocusWorld(null)
          }
          break
        case 'hint':
          setHintModes((prev) => ({ ...prev, [event.anchorId]: event.mode }))
          break
        case 'diegetic': {
          const metric = diegeticCatalogRef.current.find((m) => m.metric_id === event.metricId)
          if (!metric) break
          setActiveDiegetic((prev) => {
            const next = { ...prev }
            if (event.active) {
              next[event.metricId] = { preset: event.preset, metric }
            } else {
              delete next[event.metricId]
            }
            return next
          })
          break
        }
        case 'ambient': {
          const url = resolveAmbientUrl(event.ambientAudioId)
          if (!url) break
          try {
            if (event.action === 'start') await ambientRef.current.playLoop(url, 0.25)
            else ambientRef.current.stop()
          } catch {
            /* optional */
          }
          break
        }
        case 'fade':
          break
        case 'session_complete':
          setSessionComplete(true)
          break
        default:
          break
      }
    },
    [resolveOverlayFocus],
  )

  const applyActPayload = useCallback(
    async (payload: ActVisualPayload, cfg: SceneConfig) => {
      setCurrentAct(payload.act)
      setEnvironment(payload.environment)
      setManifest(payload.manifest)
      setSceneProject(payload.sceneProject)
      setOverlay(null)
      setOverlayFocusWorld(null)
      setMonitorChartVisible(false)
      setSubtitle(null)
      setHintModes({})
      setActiveDiegetic({})
      setSessionComplete(payload.act >= 5)
      setHighlightAnchor(primaryAnchorForAct(payload.act))

      directorRef.current?.dispose()
      narrativeRef.current?.dispose()
      narrativeRef.current = new NarrativeDirector(
        cfg,
        manifestRef.current,
        handleNarrativeEvent,
      )
      directorRef.current = ActDirector.create(
        cfg,
        payload.manifest,
        narrativeRef.current,
        payload.act,
      )
      directorRef.current.start()
    },
    [handleNarrativeEvent],
  )

  const loadAct = useCallback(
    async (act: number, cfg = configRef.current) => {
      if (!cfg) return
      const payload = await prepareActPayload(cfg, act)
      await applyActPayload(payload, cfg)
      return payload
    },
    [applyActPayload],
  )

  const transitionToAct = useCallback(
    async (act: number) => {
      const cfg = configRef.current
      if (!cfg || act === currentActRef.current) return

      const fromAct = currentActRef.current
      setTransitioning(true)
      setOverlay(null)
      setOverlayFocusWorld(null)
      setMonitorChartVisible(false)
      directorRef.current?.dispose()
      narrativeRef.current?.dispose()

      try {
        const [outgoing, incoming] = await Promise.all([
          prepareActPayload(cfg, fromAct),
          prepareActPayload(cfg, act),
        ])

        const [outgoingMesh, incomingMesh] = await Promise.all([
          outgoing.isSplat && outgoing.manifest.splat_url
            ? createReadySplatMesh(outgoing.manifest.splat_url)
            : Promise.resolve(null),
          incoming.isSplat && incoming.manifest.splat_url
            ? createReadySplatMesh(incoming.manifest.splat_url)
            : Promise.resolve(null),
        ])

        crossfadeMeshesRef.current = { out: outgoingMesh, in: incomingMesh }

        await new Promise<void>((resolve) => {
          crossfadeResolveRef.current = () => {
            disposeSplatMesh(crossfadeMeshesRef.current.out)
            disposeSplatMesh(crossfadeMeshesRef.current.in)
            crossfadeMeshesRef.current = { out: null, in: null }
            setCrossfade(null)
            resolve()
          }

          setCrossfade({
            outgoing,
            incoming,
            outgoingMesh,
            incomingMesh,
          })
        })

        await applyActPayload(incoming, cfg)
      } finally {
        setTransitioning(false)
        crossfadeResolveRef.current = null
      }
    },
    [applyActPayload],
  )

  const advanceSession = useCallback(() => {
    const next = SessionFlow.nextAct(currentActRef.current)
    if (next == null) {
      setSessionComplete(true)
      return
    }
    void transitionToAct(next)
  }, [transitionToAct])

  const bootstrap = useCallback(
    async (configUrl?: string) => {
      const cfg = await loadSceneConfig(configUrl)
      const narrativeUrl = `/narrative/${cfg.meta.persona_id}_${cfg.meta.language}.json`
      const narrative = await loadNarrativeManifest(narrativeUrl).catch(() => null)
      configRef.current = cfg
      manifestRef.current = narrative
      setConfig(cfg)
      setNarrativeManifest(narrative)

      const audion = cfg.data_layers?.audion as
        | { diegetic_metrics?: DiegeticMetricData[] }
        | undefined
      diegeticCatalogRef.current = audion?.diegetic_metrics ?? []

      sessionFlowRef.current = new SessionFlow(
        (nextAct) => void transitionToAct(nextAct),
        () => currentActRef.current,
        () => setSessionComplete(true),
      )

      const echeon = cfg.data_layers?.echeon as { feed_items?: FeedItem[] } | undefined
      const checkion = cfg.data_layers?.checkion as { metrics?: CheckionMetric[] } | undefined
      setFeedItems(echeon?.feed_items ?? [])
      setCheckionMetrics(checkion?.metrics ?? [])

      const startAct = SessionFlow.firstAct()
      const loaded = await loadAct(startAct, cfg)
      if (!loaded) return

      if (env.precacheAssets && loaded) {
        const urls = [configUrl ?? env.sceneConfigUrl, loaded.manifest.splat_url].filter(Boolean)
        for (const act of splatActsFromConfig(cfg)) {
          const envDef = resolveEnvironmentForAct(cfg, act)
          if (envDef.kind !== 'splat' || !envDef.worldSlug) continue
          urls.push(
            (await loadWorldManifestForEnvironment(envDef)).splat_url,
            sceneProjectUrl(envDef.worldSlug),
          )
        }
        const propUrls =
          loaded.sceneProject?.instances
            .slice(0, env.maxSceneProps)
            .map((i) => glbUrlFromAssetId(i.assetId)) ?? []
        const { cached, failed } = await precacheUrls([...urls, ...propUrls])
        setPrecacheStatus(`${cached} ok · ${failed} skip`)
      }
    },
    [loadAct, transitionToAct],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await bootstrap()
        if (!cancelled) setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
      directorRef.current?.dispose()
      narrativeRef.current?.dispose()
      sessionFlowRef.current?.dispose()
      ambientRef.current.dispose()
      bridgeRef.current?.disconnect()
    }
  }, [bootstrap])

  useEffect(() => {
    bridgeRef.current = new CompanionBridge({
      onSceneConfig: (cfg) => {
        configRef.current = cfg
        setConfig(cfg)
        const audion = cfg.data_layers?.audion as
          | { diegetic_metrics?: DiegeticMetricData[] }
          | undefined
        diegeticCatalogRef.current = audion?.diegetic_metrics ?? []
        sessionFlowRef.current = new SessionFlow(
          (nextAct) => void transitionToAct(nextAct),
          () => currentActRef.current,
          () => setSessionComplete(true),
        )
        void loadAct(currentActRef.current, cfg).catch(console.warn)
      },
      onStatus: (status, detail) => setWsStatus(detail ? `${status} (${detail})` : status),
    })
    bridgeRef.current.connect()
    return () => bridgeRef.current?.disconnect()
  }, [loadAct, transitionToAct])

  useEffect(() => {
    void navigator.xr?.isSessionSupported('immersive-vr').then(setVrSupported)
    return xrStore.subscribe((s) => {
      const vr = s.mode === 'immersive-vr' || s.mode === 'immersive-ar'
      setInVr(vr)
      if (vr) setShowProps(true)
    })
  }, [])

  const onEnterVr = async () => {
    setVrError(null)
    setVrEntering(true)
    try {
      await xrStore.enterVR()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setVrError(msg)
      console.warn('enterVR failed', e)
    } finally {
      setVrEntering(false)
    }
  }

  const triggerAnchor = useCallback((id: string) => {
    const envDef = environmentRef.current
    if (!envDef) return
    const anchor = envDef.anchors.find((a) => a.id === id)
    if (anchor) {
      const sem = envDef.semantics
      const world = anchorWorldPosition(anchor, sem.ground_plane_offset, sem.metric_scale_factor)
      setOverlayFocusWorld(world)
    }
    setHighlightAnchor(id)
    if (id === 'phone_main') directorRef.current?.onPickup('phone_main')
    else if (id === 'monitor_left') directorRef.current?.onLookAt('monitor_left')
    else if (id === 'sofa_main') directorRef.current?.onSitDown('sofa_main')
  }, [])

  const onAnchorSelect = (id: string, world: [number, number, number]) => {
    setOverlayFocusWorld(world)
    triggerAnchor(id)
  }

  const dismissOverlay = useCallback(() => {
    setOverlay(null)
    setOverlayFocusWorld(null)
  }, [])

  const switchAct = useCallback((act: number) => {
    void transitionToAct(act).catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [transitionToAct])

  const startDesktopPreview = useCallback(() => {
    localStorage.setItem(DESKTOP_PREVIEW_STORAGE_KEY, 'true')
    setDesktopPreview(true)
    setDesktopHelpCollapsed(false)
  }, [])

  const showDesktopUi = !inVr && desktopPreview
  const showVrGate = !inVr && !desktopPreview

  useDesktopSession({
    enabled: showDesktopUi,
    onSwitchAct: switchAct,
    onAdvanceAct: advanceSession,
    onDismissOverlay: dismissOverlay,
    onTriggerAnchor: triggerAnchor,
  })

  useEffect(() => {
    if (!showDesktopUi || currentAct !== 3) return
    const id = globalThis.setTimeout(() => {
      directorRef.current?.onLookAt('monitor_left')
    }, 14_000)
    return () => globalThis.clearTimeout(id)
  }, [showDesktopUi, currentAct])

  const lightingPreset = config
    ? environmentForAct(config, currentAct)?.lighting_preset
    : 'morning_warm'

  const hint = actInteractionHint(currentAct, showDesktopUi)
  const canAdvance = !sessionComplete && SessionFlow.nextAct(currentAct) != null

  if (loading) {
    return <div className="screen-center">Lade Persona Reality…</div>
  }
  if (error || !config || !manifest || !environment) {
    return <div className="screen-center error">Fehler: {error ?? 'Keine Daten'}</div>
  }

  const reportQrUrl = config.report?.qr_url
  const diegeticList = Object.values(activeDiegetic)

  return (
    <div className="app-root">
      <Hud
        act={currentAct}
        environmentId={manifest.environment_id}
        environmentName={environment.displayName}
        splatTier={manifest.splat_tier}
        fps={fps}
        vrSupported={vrSupported}
        inVr={inVr}
        desktopPreview={showDesktopUi}
        wsStatus={wsStatus}
        precacheStatus={precacheStatus}
        showProps={showProps}
        onToggleProps={() => setShowProps((v) => !v)}
        onSwitchAct={switchAct}
        onAdvanceAct={advanceSession}
        canAdvance={canAdvance}
        sessionComplete={sessionComplete}
        onEnterVr={() => void onEnterVr()}
        onExitVr={() => {
          void xrStore.getState().session?.end()
          setVrError(null)
        }}
        onExportMetrics={() => {
          metricsRef.current.persist()
          metricsRef.current.downloadJson()
        }}
      />
      <ActTransition
        visible={transitioning}
        subtle={Boolean(crossfade)}
        label={crossfade ? 'Szene löst sich Punkt für Punkt auf…' : `Act ${currentAct}…`}
      />
      {showVrGate && (
        <VrEntryScreen
          supported={vrSupported}
          loading={vrEntering}
          error={vrError}
          onEnterVr={() => void onEnterVr()}
          onStartDesktop={startDesktopPreview}
        />
      )}
      {showDesktopUi && !desktopHelpCollapsed && (
        <DesktopHelpBar
          hint={hint}
          vrSupported={vrSupported}
          onEnterVr={() => void onEnterVr()}
          onCollapse={() => setDesktopHelpCollapsed(true)}
        />
      )}
      {showDesktopUi && desktopHelpCollapsed && (
        <button
          type="button"
          className="desktop-help-toggle"
          onClick={() => setDesktopHelpCollapsed(false)}
          aria-label="Steuerungshinweis anzeigen"
        >
          ?
        </button>
      )}
      <Canvas
        shadows
        dpr={canvasDprBounds()}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <XR store={xrStore}>
          <VrRenderQuality />
          <FpsCounter onFps={setFps} metrics={metricsRef.current} />
          {crossfade ? (
            <SplatCrossfadeScene
              outgoing={crossfade.outgoing}
              incoming={crossfade.incoming}
              outgoingMesh={crossfade.outgoingMesh}
              incomingMesh={crossfade.incomingMesh}
              onComplete={() => crossfadeResolveRef.current?.()}
            />
          ) : (
            <EnvironmentScene
              act={currentAct}
              environment={environment}
              manifest={manifest}
              sceneProject={sceneProject}
              lightingPreset={lightingPreset}
              showProps={showProps}
              highlightAnchor={highlightAnchor}
              hintModes={hintModes}
              activeDiegetic={diegeticList}
              onAnchorSelect={onAnchorSelect}
              onDismissOverlay={dismissOverlay}
              overlay={overlay}
              overlayFocusWorld={overlayFocusWorld}
              feedItems={feedItems}
              checkionMetrics={checkionMetrics}
              monitorChartVisible={monitorChartVisible}
              reportQrUrl={reportQrUrl}
            />
          )}
        </XR>
      </Canvas>
      {!inVr && overlay && (
        <OverlayPanel
          overlay={overlay}
          feedItems={feedItems}
          checkionMetrics={checkionMetrics}
          onClose={dismissOverlay}
        />
      )}
      <NovaSubtitle
        text={subtitle?.text ?? null}
        trackId={subtitle?.trackId}
        lineIndex={subtitle?.lineIndex}
        totalLines={subtitle?.totalLines}
        visible={Boolean(subtitle?.text) && !crossfade}
      />
    </div>
  )
}
