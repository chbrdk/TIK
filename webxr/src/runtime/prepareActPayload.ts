import type { EnvironmentDefinition } from '@/config/environments'
import { resolveEnvironmentForAct } from '@/runtime/resolveEnvironment'
import {
  loadWorldManifestForEnvironment,
  mergeManifestAnchors,
} from '@/runtime/WorldManifestLoader'
import { loadSceneProjectForSlug } from '@/runtime/SceneProjectLoader'
import { environmentForAct } from '@/runtime/SceneConfigLoader'
import type { SceneConfig } from '@/schema/scene-config'
import type { WorldManifest } from '@/schema/world-manifest'
import type { SceneProject } from '@/schema/scene-project'

export interface ActVisualPayload {
  act: number
  environment: EnvironmentDefinition
  manifest: WorldManifest
  sceneProject: SceneProject | null
  lightingPreset: string
  isSplat: boolean
}

export async function prepareActPayload(
  cfg: SceneConfig,
  act: number,
): Promise<ActVisualPayload> {
  const envDef = resolveEnvironmentForAct(cfg, act)
  const man = await loadWorldManifestForEnvironment(envDef)
  const environment = mergeManifestAnchors(envDef, man)
  const project =
    envDef.kind === 'splat' && envDef.worldSlug
      ? await loadSceneProjectForSlug(envDef.worldSlug)
      : null
  const lightingPreset = environmentForAct(cfg, act)?.lighting_preset ?? 'midday_neutral'

  return {
    act,
    environment,
    manifest: man,
    sceneProject: project,
    lightingPreset,
    isSplat: envDef.kind === 'splat' && Boolean(man.splat_url),
  }
}
