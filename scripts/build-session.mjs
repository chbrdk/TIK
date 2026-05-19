#!/usr/bin/env node
/**
 * Pipeline: persona_profile → slim persona → all act bundles.
 *
 * Usage:
 *   node scripts/build-session.mjs --profile klaus_dortmund
 *   node scripts/build-session.mjs --input fixtures/persona-inputs/klaus_dortmund.json
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function main() {
  let profileId = null
  let inputPath = null

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--profile') profileId = process.argv[++i]
    else if (process.argv[i] === '--input') inputPath = process.argv[++i]
  }

  if (inputPath) {
    const input = JSON.parse(readFileSync(inputPath, 'utf-8'))
    profileId = profileId ?? inputPath.split('/').pop().replace('.json', '')
    const profilePath = join(ROOT, 'fixtures/persona-profiles', `${profileId}.json`)
    if (!existsSync(profilePath)) {
      console.error(
        `Persona profile missing: ${profilePath}\n\n` +
          `→ Run persona agent (tik-persona-builder) with these inputs:\n${JSON.stringify(input, null, 2)}`,
      )
      process.exit(1)
    }
  }

  if (!profileId) {
    console.error('Usage: build-session.mjs --profile <id> | --input <persona-inputs.json>')
    process.exit(1)
  }

  const profilePath = join(ROOT, 'fixtures/persona-profiles', `${profileId}.json`)
  if (!existsSync(profilePath)) {
    console.error(`Missing: ${profilePath}`)
    process.exit(1)
  }

  execSync(`node scripts/compile-persona-profile.mjs --profile ${profileId}`, {
    cwd: ROOT,
    stdio: 'inherit',
  })
  execSync(
    `node scripts/compile-act-blueprint.mjs --all --persona ${profileId} --profile ${profileId}`,
    { cwd: ROOT, stdio: 'inherit' },
  )
  console.log(`\nDone. Review: fixtures/generated/${profileId}/`)
}

main()
