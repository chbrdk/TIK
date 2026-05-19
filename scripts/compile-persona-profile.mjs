#!/usr/bin/env node
/**
 * persona_profile → slim fixtures/personas/{id}.json (for act compile placeholders)
 *
 * Usage: node scripts/compile-persona-profile.mjs --profile klaus_dortmund
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function main() {
  const id = process.argv.includes('--profile')
    ? process.argv[process.argv.indexOf('--profile') + 1]
    : null
  if (!id) {
    console.error('Usage: node scripts/compile-persona-profile.mjs --profile <persona_id>')
    process.exit(1)
  }

  const profilePath = join(ROOT, 'fixtures/persona-profiles', `${id}.json`)
  const profile = JSON.parse(readFileSync(profilePath, 'utf-8'))
  const p = profile.persona

  const slim = {
    id: p.id,
    display_name: p.display_name,
    occupation: p.occupation,
    location: p.location,
    household: p.household ?? '',
    industry: p.axes.industry,
    sector: p.axes.sector,
    language: profile.meta.language,
    company_name: profile.company_context.name,
    company_industry: profile.company_context.industry ?? profile.inputs.company.industry ?? '',
  }

  const outPath = join(ROOT, 'fixtures/personas', `${id}.json`)
  writeFileSync(outPath, `${JSON.stringify(slim, null, 2)}\n`)

  const genDir = join(ROOT, 'fixtures/generated', id)
  mkdirSync(genDir, { recursive: true })
  writeFileSync(join(genDir, 'persona-profile.json'), `${JSON.stringify(profile, null, 2)}\n`)

  console.log(`Persona slim → ${outPath}`)
  console.log(`Profile copy → ${genDir}/persona-profile.json`)
}

main()
