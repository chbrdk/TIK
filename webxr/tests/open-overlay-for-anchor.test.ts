import { describe, expect, it } from 'vitest'
import { overlayForAnchor } from '@/runtime/openOverlayForAnchor'
import type { SceneConfig } from '@/schema/scene-config'

const cfg = {
  narrative_beats: [
    {
      act: 2,
      trigger_type: 'pickup',
      trigger_target: 'phone_main',
      ui_overlay: { type: 'news_feed', anchor_object: 'phone_main', payload: {} },
    },
  ],
} as unknown as SceneConfig

describe('openOverlayForAnchor', () => {
  it('resolves overlay for phone_main', () => {
    const o = overlayForAnchor(cfg, 2, 'phone_main')
    expect(o?.type).toBe('news_feed')
  })
})
