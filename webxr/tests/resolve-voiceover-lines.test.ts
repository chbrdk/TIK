import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  resolvePlayableTrackId,
  resolveTrackLines,
  resolveVoiceoverLines,
} from '@/runtime/resolveVoiceoverLines'
import { narrativeManifestSchema } from '@/schema/narrative-manifest'
import { sceneConfigSchema } from '@/schema/scene-config'

const webxrRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(webxrRoot, '..')
const golden = JSON.parse(
  readFileSync(join(repoRoot, 'fixtures/golden/klaus_dortmund_de.json'), 'utf-8'),
)
const narrative = narrativeManifestSchema.parse(
  JSON.parse(
    readFileSync(join(repoRoot, 'fixtures/narrative/klaus_dortmund_de.json'), 'utf-8'),
  ),
)

describe('resolveVoiceoverLines', () => {
  const config = sceneConfigSchema.parse(golden)

  it('uses merged lines on beat when present', () => {
    const beat = config.narrative_beats.find((b) => b.act === 2)!
    const lines = resolveVoiceoverLines(beat, narrative)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0].text).toContain('echeon')
  })

  it('falls back to manifest track', () => {
    const beat = { act: 2, trigger_type: 'pickup', voiceover_track_id: 'nova_de_act2_01' }
    const lines = resolveVoiceoverLines(beat, narrative)
    expect(lines.some((l) => l.text.includes('Sieben Uhr'))).toBe(true)
  })

  it('maps placeholder pre_beat track_id to nova_de_act', () => {
    const lines = resolveTrackLines('voiceover_pre_beat_01', narrative, 2)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.some((l) => l.text.includes('Sieben Uhr'))).toBe(true)
  })
})

describe('resolvePlayableTrackId (Schott)', () => {
  const schottNarrative = narrativeManifestSchema.parse(
    JSON.parse(
      readFileSync(
        join(webxrRoot, 'public/narrative/schott_glasbau_ingenieur_v8_de.json'),
        'utf-8',
      ),
    ),
  )

  it('maps schott_glasbau_act_01 to nova_de_act1_01 for MP3 playback', () => {
    expect(resolvePlayableTrackId('schott_glasbau_act_01', schottNarrative, 1)).toBe(
      'nova_de_act1_01',
    )
  })

  it('maps voiceover_pre_beat_01 with act hint', () => {
    expect(resolvePlayableTrackId('voiceover_pre_beat_01', schottNarrative, 2)).toBe(
      'nova_de_act2_01',
    )
  })

  it('maps schott_glasbau_act_03_voiceover_01 to act 3 track', () => {
    expect(
      resolvePlayableTrackId('schott_glasbau_act_03_voiceover_01', schottNarrative, 3),
    ).toBe('nova_de_act3_01')
  })
})
