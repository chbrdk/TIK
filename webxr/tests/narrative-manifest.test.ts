import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { narrativeManifestSchema } from '@/schema/narrative-manifest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const raw = JSON.parse(
  readFileSync(join(root, 'fixtures/narrative/klaus_dortmund_de.json'), 'utf-8'),
)

describe('narrative manifest', () => {
  const manifest = narrativeManifestSchema.parse(raw)

  it('has five act scripts', () => {
    expect(manifest.act_scripts).toHaveLength(5)
  })

  it('includes pre-beat tracks for act 2', () => {
    expect(manifest.voiceover_tracks.nova_de_act2_01).toBeDefined()
    expect(manifest.voiceover_tracks.nova_de_act2_02).toBeDefined()
  })

  it('act 2 has pickup beat cue template', () => {
    const act2 = manifest.act_scripts.find((s) => s.act === 2)!
    expect(act2.beat_cue_templates?.nova_de_act2_02?.some((c) => c.type === 'overlay_show')).toBe(
      true,
    )
  })

  it('act 3 monitor beat uses chart_show cue', () => {
    const act3 = manifest.act_scripts.find((s) => s.act === 3)!
    expect(act3.beat_cue_templates?.nova_de_act3_02?.some((c) => c.type === 'chart_show')).toBe(
      true,
    )
  })

  it('act 3 pre-beat auto-shows chart', () => {
    const act3 = manifest.act_scripts.find((s) => s.act === 3)!
    expect(act3.pre_beat_cues?.some((c) => c.type === 'chart_show')).toBe(true)
  })
})
