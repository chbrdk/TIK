import type { NarrativeBeat, SceneConfig, UiOverlay } from '@/schema/scene-config'

export function findBeatForAnchor(
  config: SceneConfig,
  act: number,
  anchorId: string,
): NarrativeBeat | undefined {
  return config.narrative_beats.find(
    (b) =>
      b.act === act &&
      b.trigger_target === anchorId &&
      (b.trigger_type === 'pickup' ||
        b.trigger_type === 'look_at' ||
        b.trigger_type === 'sit_down' ||
        b.trigger_type === 'timer'),
  )
}

export function overlayForAnchor(
  config: SceneConfig,
  act: number,
  anchorId: string,
): UiOverlay | null {
  return findBeatForAnchor(config, act, anchorId)?.ui_overlay ?? null
}
