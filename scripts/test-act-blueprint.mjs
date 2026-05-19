#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

execSync('node scripts/validate-act-blueprint.mjs', { cwd: ROOT, stdio: 'inherit' })
execSync(
  'node scripts/compile-act-blueprint.mjs --act 3 --persona klaus_dortmund --out fixtures/generated/_test',
  { cwd: ROOT, stdio: 'inherit' },
)

const bundle = JSON.parse(
  readFileSync(join(ROOT, 'fixtures/generated/_test/act-03-bundle.json'), 'utf-8'),
)
assert.equal(bundle.act, 3)
assert.ok(bundle.voiceover_tracks.nova_de_act3_02)
assert.ok(bundle.narrative_beat.cues.some((c) => c.type === 'chart_show'))
assert.ok(bundle.data_layer_slice.checkion?.metrics?.length === 3)
assert.ok(bundle.image_prompts.splat_world.prompt_en.length > 20)
console.log('act-blueprint tests OK')
