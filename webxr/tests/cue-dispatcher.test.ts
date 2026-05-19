import { describe, expect, it, vi } from 'vitest'
import { CueDispatcher } from '@/runtime/CueDispatcher'
import type { SceneConfig } from '@/schema/scene-config'

const minimalConfig = {
  meta: { scene_id: 'x', persona_id: 'klaus_dortmund' },
  environments: [],
  narrative_beats: [
    {
      act: 2,
      trigger_type: 'pickup',
      voiceover_track_id: 'nova_de_act2_02',
      ui_overlay: { type: 'news_feed', anchor_object: 'phone_main' },
    },
  ],
} as SceneConfig

describe('CueDispatcher', () => {
  it('dispatches overlay_show with beat overlay', () => {
    const handler = vi.fn()
    const dispatcher = new CueDispatcher(handler, minimalConfig, null, 2, (b) => b.ui_overlay ?? null)
    const beat = minimalConfig.narrative_beats[0]
    dispatcher.dispatch({ type: 'overlay_show', at_sec: 0 }, beat)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'overlay',
        overlay: expect.objectContaining({ type: 'news_feed' }),
      }),
    )
  })

  it('dispatches chart_show on monitor', () => {
    const handler = vi.fn()
    const dispatcher = new CueDispatcher(handler, minimalConfig, null, 3, () => null)
    dispatcher.dispatch(
      { type: 'chart_show', at_sec: 0, anchor_object: 'monitor_left' },
      null,
    )
    expect(handler).toHaveBeenCalledWith({
      type: 'chart_dashboard',
      visible: true,
      anchorObject: 'monitor_left',
    })
  })

  it('dispatches act_complete', () => {
    const handler = vi.fn()
    const dispatcher = new CueDispatcher(handler, minimalConfig, null, 1, () => null)
    dispatcher.dispatch({ type: 'act_advance', at_sec: 14 })
    expect(handler).toHaveBeenCalledWith({ type: 'act_complete' })
  })
})
