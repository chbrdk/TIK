#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

execSync('node scripts/validate-persona-inputs.mjs', { cwd: ROOT, stdio: 'inherit' })
execSync('node scripts/validate-persona-profile.mjs', { cwd: ROOT, stdio: 'inherit' })
execSync('node scripts/compile-persona-profile.mjs --profile klaus_dortmund', {
  cwd: ROOT,
  stdio: 'inherit',
})
execSync(
  'node scripts/compile-act-blueprint.mjs --act 3 --persona klaus_dortmund --profile klaus_dortmund --out fixtures/generated/_test_persona',
  { cwd: ROOT, stdio: 'inherit' },
)

const slim = JSON.parse(readFileSync(join(ROOT, 'fixtures/personas/klaus_dortmund.json'), 'utf-8'))
assert.equal(slim.company_name, 'MSQ DX')

const bundle = JSON.parse(
  readFileSync(join(ROOT, 'fixtures/generated/_test_persona/act-03-bundle.json'), 'utf-8'),
)
assert.ok(bundle.data_layer_slice.checkion.metrics.length >= 3)
console.log('persona pipeline tests OK')
