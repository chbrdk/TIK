import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolveVoiceoverLines } from '@/runtime/resolveVoiceoverLines'
import { narrativeManifestSchema } from '@/schema/narrative-manifest'
import { sceneConfigSchema } from '@/schema/scene-config'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const golden = JSON.parse(
  readFileSync(join(root, 'fixtures/golden/klaus_dortmund_de.json'), 'utf-8'),
)
const narrative = narrativeManifestSchema.parse(
  JSON.parse(readFileSync(join(root, 'fixtures/narrative/klaus_dortmund_de.json'), 'utf-8')),
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
})
