import {
  getEnvironmentByAct,
  getEnvironmentById,
  type EnvironmentDefinition,
  type PlaceholderVariant,
} from '@/config/environments'
import type { SceneConfig } from '@/schema/scene-config'
import { environmentForAct } from './SceneConfigLoader'

function fallbackPlaceholder(act: number, environmentId: string): EnvironmentDefinition {
  const variant: PlaceholderVariant =
    act === 1 ? 'void_mirror' : act === 5 ? 'void_constellation' : 'living_room'
  return {
    environmentId,
    defaultAct: act,
    kind: 'placeholder',
    placeholderVariant: variant,
    displayName: `Platzhalter (Act ${act})`,
    anchors: [{ id: 'mirror_center', position: [0, 1.4, -2] }],
    semantics: { metric_scale_factor: 1, ground_plane_offset: 0, flip_y: false },
  }
}

/**
 * Resolves scene_config environment_id for an act → registry entry.
 * scene_config is authoritative for which id is used; registry supplies assets.
 */
function environmentFromSceneBinding(
  config: SceneConfig,
  act: number,
  binding: NonNullable<ReturnType<typeof environmentForAct>>,
): EnvironmentDefinition {
  if (binding.world_slug) {
    const worldSlug = binding.world_slug
    const known = getEnvironmentById(binding.environment_id)
    return {
      environmentId: binding.environment_id,
      defaultAct: act,
      kind: 'splat',
      worldSlug,
      displayName: binding.environment_id,
      anchors: known?.anchors ?? [{ id: 'scene_center', position: [0, 1.2, -1.5] }],
      semantics: known?.semantics ?? {
        metric_scale_factor: 1,
        ground_plane_offset: 0,
        flip_y: true,
      },
    }
  }

  const known = getEnvironmentById(binding.environment_id)
  if (known) return known
  return fallbackPlaceholder(act, binding.environment_id)
}

export function resolveEnvironmentForAct(
  config: SceneConfig,
  act: number,
): EnvironmentDefinition {
  const binding = environmentForAct(config, act)
  if (binding) {
    return environmentFromSceneBinding(config, act, binding)
  }
  const byAct = getEnvironmentByAct(act)
  if (byAct) return byAct
  throw new Error(`No environment for act ${act}`)
}

export function splatActsFromConfig(config: SceneConfig): number[] {
  return config.environments
    .filter((e) => resolveEnvironmentForAct(config, e.act).kind === 'splat')
    .map((e) => e.act)
    .sort((a, b) => a - b)
}
