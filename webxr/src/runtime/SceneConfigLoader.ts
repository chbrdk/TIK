import { env } from '@/config/env'
import { sceneConfigSchema, type SceneConfig } from '@/schema/scene-config'

export async function loadSceneConfig(url = env.sceneConfigUrl): Promise<SceneConfig> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`scene_config fetch failed: ${response.status}`)
  const json: unknown = await response.json()
  return sceneConfigSchema.parse(json)
}

export function environmentForAct(config: SceneConfig, act: number) {
  return config.environments.find((e) => e.act === act)
}

export function beatsForAct(config: SceneConfig, act: number) {
  return config.narrative_beats.filter((b) => b.act === act)
}
