#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

execSync(
  'node scripts/compile-act-blueprint.mjs --act 2 --persona klaus_dortmund --profile schott_glasbau_ingenieur --out fixtures/generated/_test_arc',
  { cwd: ROOT, stdio: 'inherit' },
)

const bundle = JSON.parse(
  readFileSync(join(ROOT, 'fixtures/generated/_test_arc/act-02-bundle.json'), 'utf-8'),
)

assert.equal(bundle.environment.environment_id, 'env_schott_facade_planning_morning_v1')
assert.equal(bundle.environment.world_slug, 'schott-facade-planning-morning')
assert.equal(bundle.narrative_beat.trigger_target, 'planning_tablet')
assert.ok(bundle.scene_environment.world_slug)

console.log('session_arc compile tests OK')
