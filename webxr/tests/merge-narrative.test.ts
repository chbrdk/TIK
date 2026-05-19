import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sceneConfigSchema } from '@/schema/scene-config'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const golden = JSON.parse(
  readFileSync(join(root, 'fixtures/golden/klaus_dortmund_de.json'), 'utf-8'),
)

describe('merged golden scene_config', () => {
  const config = sceneConfigSchema.parse(golden)

  it('has lines on all five beats', () => {
    for (let act = 1; act <= 5; act++) {
      const beat = config.narrative_beats.find((b) => b.act === act)
      expect(beat?.lines?.length).toBeGreaterThan(0)
    }
  })

  it('act 2 beat has overlay cues', () => {
    const beat = config.narrative_beats.find((b) => b.act === 2)!
    expect(beat.cues?.some((c) => c.type === 'overlay_show')).toBe(true)
  })

  it('act 3 uses nova_de_act3_02 for monitor beat', () => {
    const beat = config.narrative_beats.find((b) => b.act === 3)!
    expect(beat.voiceover_track_id).toBe('nova_de_act3_02')
  })

  it('act 3 monitor beat uses in-world chart cues', () => {
    const beat = config.narrative_beats.find((b) => b.act === 3)!
    expect(beat.cues?.some((c) => c.type === 'chart_show')).toBe(true)
    expect(beat.cues?.some((c) => c.type === 'overlay_show')).toBe(false)
  })
})
