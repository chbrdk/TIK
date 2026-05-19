import { devBlasterWorldSplatUrl } from '@/config/paths'
import { env, type SplatTier } from '@/config/env'

async function resolveSplatAsset(
  slug: string,
  preferred: SplatTier,
): Promise<{ url: string; tier: SplatTier }> {
  const order = [
    preferred,
    ...env.splatTierFallbacks.filter((t) => t !== preferred),
  ] as SplatTier[]

  for (const tier of order) {
    const url = devBlasterWorldSplatUrl(slug, tier)
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok) return { url, tier }
    } catch {
      /* try next tier */
    }
  }

  return { url: devBlasterWorldSplatUrl(slug, preferred), tier: preferred }
}
import type { EnvironmentDefinition } from '@/config/environments'
import { worldManifestUrl } from '@/config/environments'
import { worldManifestSchema, type WorldManifest } from '@/schema/world-manifest'

interface WorldSemanticsJson {
  assets?: {
    splats?: {
      semantics_metadata?: {
        metric_scale_factor?: number
        ground_plane_offset?: number
        flip_y?: boolean
      }
    }
  }
}

async function loadSemanticsFromBlaster(slug: string) {
  try {
    const res = await fetch(`/worlds/${slug}/output/world/0-world.json`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as WorldSemanticsJson
    const meta = data.assets?.splats?.semantics_metadata
    if (!meta) return null
    return {
      metric_scale_factor: meta.metric_scale_factor ?? 1,
      ground_plane_offset: meta.ground_plane_offset ?? 0,
      flip_y: meta.flip_y ?? true,
    }
  } catch {
    return null
  }
}

export function placeholderManifest(
  envDef: EnvironmentDefinition,
  splatTier: SplatTier = env.splatTier,
): WorldManifest {
  return {
    slug: envDef.environmentId,
    environment_id: envDef.environmentId,
    splat_url: '',
    splat_tier: splatTier,
    collider_url: undefined,
    semantics: { ...envDef.semantics },
  }
}

/** Apply image-blaster manifest anchor positions over the static registry. */
export function mergeManifestAnchors(
  envDef: EnvironmentDefinition,
  manifest: WorldManifest,
): EnvironmentDefinition {
  if (!manifest.anchors?.length) return envDef
  const byId = new Map(envDef.anchors.map((a) => [a.id, { ...a }]))
  for (const ma of manifest.anchors) {
    const existing = byId.get(ma.id)
    if (existing) existing.position = ma.position
    else byId.set(ma.id, { id: ma.id, position: ma.position })
  }
  return { ...envDef, anchors: Array.from(byId.values()) }
}

export async function loadWorldManifestForEnvironment(
  envDef: EnvironmentDefinition,
  splatTier: SplatTier = env.splatTier,
): Promise<WorldManifest> {
  if (envDef.kind === 'placeholder' || !envDef.worldSlug) {
    return placeholderManifest(envDef, splatTier)
  }

  const slug = envDef.worldSlug
  const url = worldManifestUrl(slug)
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (response.ok) {
      const manifest = worldManifestSchema.parse(await response.json())
      if (!manifest.semantics) {
        const semantics = await loadSemanticsFromBlaster(slug)
        if (semantics) return { ...manifest, semantics }
      }
      return manifest
    }
  } catch {
    /* dev fallback */
  }

  const semantics = (await loadSemanticsFromBlaster(slug)) ?? { ...envDef.semantics }
  const splat = await resolveSplatAsset(slug, splatTier)

  return {
    slug,
    environment_id: envDef.environmentId,
    splat_url: splat.url,
    splat_tier: splat.tier,
    collider_url: `/worlds/${slug}/output/world/0-world.glb`,
    semantics,
  }
}
