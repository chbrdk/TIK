export type SplatTier = '100k' | '150k' | '500k' | 'full_res'

const SPLAT_TIERS: SplatTier[] = ['100k', '150k', '500k', 'full_res']

function parseSplatTier(raw: string | undefined): SplatTier | undefined {
  if (raw && SPLAT_TIERS.includes(raw as SplatTier)) return raw as SplatTier
  return undefined
}

function defaultSplatTier(): SplatTier {
  const explicit = parseSplatTier(import.meta.env.VITE_SPLAT_TIER)
  if (explicit) return explicit
  return import.meta.env.DEV ? '150k' : '500k'
}

function numEnv(key: string, fallback: number): number {
  const raw = import.meta.env[key]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Runtime URLs — override via Vite env, never hardcode production hosts here. */
export const env = {
  sceneConfigUrl:
    import.meta.env.VITE_SCENE_CONFIG_URL ?? '/scene_configs/klaus_dortmund_de.json',
  companionWsUrl:
    import.meta.env.VITE_COMPANION_WS_URL ?? 'ws://localhost:8765',
  precacheAssets: import.meta.env.VITE_PRECACHE_ASSETS !== 'false',
  showSceneProps: import.meta.env.VITE_SHOW_SCENE_PROPS !== 'false',
  maxSceneProps: Number(import.meta.env.VITE_MAX_SCENE_PROPS ?? '12'),
  /** SPZ density — dev defaults to full_res; Quest builds use 500k unless overridden. */
  splatTier: defaultSplatTier(),
  /** Fallback tiers when preferred SPZ is missing (dev /worlds proxy). */
  splatTierFallbacks: SPLAT_TIERS,
  /** WebXR render target scale (1.0–2.5). Higher = sharper headset view. */
  vrFramebufferScale: Math.min(
    2.5,
    Math.max(1, numEnv('VITE_VR_FRAMEBUFFER_SCALE', import.meta.env.DEV ? 2 : 1.5)),
  ),
  /** Cap for R3F Canvas dpr={[1, canvasMaxDpr]}. */
  canvasMaxDpr: Math.min(3, Math.max(1, numEnv('VITE_CANVAS_MAX_DPR', import.meta.env.DEV ? 2.5 : 2))),
  /** Desktop WebGL pixel ratio cap (retina sharpness). */
  desktopMaxPixelRatio: Math.min(
    3,
    Math.max(1, numEnv('VITE_DESKTOP_MAX_PIXEL_RATIO', import.meta.env.DEV ? 2.5 : 2)),
  ),
  vrMaxPixelRatio: Math.min(2, Math.max(1, numEnv('VITE_VR_MAX_PIXEL_RATIO', 2))),
  /** Desktop: no LoD + larger splat footprint = crisper preview. */
  highQualityDesktop: import.meta.env.VITE_HIGH_QUALITY_DESKTOP !== 'false',
  enableLodInVr: import.meta.env.VITE_ENABLE_LOD_VR !== 'false',
  encodeLinearSplats: import.meta.env.VITE_ENCODE_LINEAR_SPLATS === 'true',
  sparkMaxPixelRadiusDesktop: numEnv('VITE_SPARK_MAX_PIXEL_RADIUS_DESKTOP', 768),
  sparkMaxPixelRadiusVr: numEnv('VITE_SPARK_MAX_PIXEL_RADIUS_VR', 512),
  desktopPreview:
    import.meta.env.VITE_DESKTOP_PREVIEW === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_DESKTOP_PREVIEW !== 'false'),
  /** image-blaster world slug for Act 2 kitchen splat (see sync-world-from-blaster.sh). */
  kitchenWorldSlug:
    import.meta.env.VITE_KITCHEN_WORLD_SLUG ?? 'schott-act2-kitchen',
} as const

export const DESKTOP_PREVIEW_STORAGE_KEY = 'tik-desktop-preview'
