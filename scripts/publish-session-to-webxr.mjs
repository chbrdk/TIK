#!/usr/bin/env node
/**
 * Copy golden scene_config + narrative to webxr/public for Quest preview.
 * Usage: node scripts/publish-session-to-webxr.mjs --profile <persona_id> [--lang de]
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WEBXR_PUBLIC = join(ROOT, 'webxr/public')

function parseArgs() {
  let profile = null
  let lang = 'de'
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--profile') profile = process.argv[++i]
    else if (process.argv[i] === '--lang') lang = process.argv[++i]
  }
  if (!profile) {
    console.error('Usage: publish-session-to-webxr.mjs --profile <persona_id> [--lang de]')
    process.exit(1)
  }
  return { profile, lang }
}

function main() {
  const { profile, lang } = parseArgs()
  const golden = join(ROOT, 'fixtures/golden', `${profile}_${lang}.json`)
  const narrative = join(ROOT, 'fixtures/narrative', `${profile}_${lang}.json`)
  if (!existsSync(golden)) {
    console.error(`Missing golden: ${golden} — run assemble first`)
    process.exit(1)
  }
  mkdirSync(join(WEBXR_PUBLIC, 'scene_configs'), { recursive: true })
  mkdirSync(join(WEBXR_PUBLIC, 'narrative'), { recursive: true })
  const destConfig = join(WEBXR_PUBLIC, 'scene_configs', `${profile}_${lang}.json`)
  copyFileSync(golden, destConfig)
  console.log(`OK scene_config → ${destConfig}`)
  if (existsSync(narrative)) {
    const destNarr = join(WEBXR_PUBLIC, 'narrative', `${profile}_${lang}.json`)
    copyFileSync(narrative, destNarr)
    console.log(`OK narrative → ${destNarr}`)
  } else {
    console.warn(`No narrative fixture at ${narrative}`)
  }
}

main()
