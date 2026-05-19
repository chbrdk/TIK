#!/usr/bin/env node
/**
 * Build fixtures/golden/{persona_id}_{lang}.json from compile output.
 * Usage: node scripts/assemble-scene-config-from-manifest.mjs --profile sick_instandhaltung_lebensmittel_v1
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs() {
  let profile = null
  let lang = 'de'
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--profile') profile = process.argv[++i]
    else if (process.argv[i] === '--lang') lang = process.argv[++i]
  }
  if (!profile) {
    console.error('Usage: assemble-scene-config-from-manifest.mjs --profile <persona_id> [--lang de]')
    process.exit(1)
  }
  return { profile, lang }
}

function main() {
  const { profile, lang } = parseArgs()
  const genDir = join(ROOT, 'fixtures/generated', profile)
  const manifest = JSON.parse(
    readFileSync(join(genDir, 'session-act-manifest.json'), 'utf-8'),
  )
  const profileDoc = JSON.parse(
    readFileSync(join(ROOT, 'fixtures/persona-profiles', `${profile}.json`), 'utf-8'),
  )
  const p = profileDoc.persona

  const environments = manifest.environment_bindings.map((b) => ({
    act: b.act,
    environment_id: b.environment_id,
    world_slug: b.world_slug,
    lighting_preset: b.lighting_preset,
    time_of_day: b.time_of_day,
    weather: b.weather ?? 'clear',
    skybox_id: b.skybox_id ?? null,
  }))

  const slices = manifest.data_layer_slices ?? []
  const data_layers = {
    echeon: slices[1]?.echeon ?? { feed_items: [], cache_ttl_sec: 1800 },
    checkion: slices[2]?.checkion ?? { metrics: [] },
    audion: slices[3]?.audion ?? { diegetic_metrics: [] },
    storyblok: {
      page_variant_a_texture:
        'https://cdn.msqdx.de/persona-reality/storyblok/sick_personalized_v1.png',
      page_variant_b_texture:
        'https://cdn.msqdx.de/persona-reality/storyblok/sick_generic_v1.png',
    },
  }

  const sceneId = `se_${profile}_${lang}`
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  const sceneConfig = {
    meta: {
      scene_id: sceneId,
      persona_id: profile,
      generated_at: now,
      duration_sec: 300,
      language: lang,
      client_id: profileDoc.company_context?.name?.toLowerCase().includes('sick')
        ? 'sick_ag'
        : null,
      schema_version: '1.0',
    },
    persona: {
      id: p.id,
      display_name: p.display_name,
      age: p.age,
      gender_expression: p.gender_expression,
      location: p.location,
      occupation: p.occupation,
      household: p.household,
      income_band: p.income_band,
      axes: p.axes,
      pain_points: p.pain_points,
      decision_drivers: p.decision_drivers,
    },
    avatar: {
      avatar_asset_id: `avatar_${profile}_v1`,
      rpm_avatar_id: `rpm_${profile}_v1`,
      voice_id_elevenlabs: `el_${profile}_${lang}_v1`,
      outfit_preset: profileDoc.avatar_hints?.outfit_preset ?? 'business_casual',
    },
    environments,
    narrative_beats: manifest.narrative_beats,
    data_layers,
    brand_layer: null,
    report: {
      qr_url: `https://msqdx.de/pr/r/${sceneId}`,
      report_id: sceneId,
    },
  }

  const narrativeManifest = {
    meta: {
      persona_id: profile,
      language: lang,
      schema_version: '1.0',
    },
    voiceover_tracks: manifest.voiceover_tracks,
    act_scripts: manifest.act_scripts,
  }

  mkdirSync(join(ROOT, 'fixtures/golden'), { recursive: true })
  mkdirSync(join(ROOT, 'fixtures/narrative'), { recursive: true })

  const scenePath = join(ROOT, 'fixtures/golden', `${profile}_${lang}.json`)
  const narrativePath = join(ROOT, 'fixtures/narrative', `${profile}_${lang}.json`)

  writeFileSync(scenePath, `${JSON.stringify(sceneConfig, null, 2)}\n`)
  writeFileSync(narrativePath, `${JSON.stringify(narrativeManifest, null, 2)}\n`)

  console.log(JSON.stringify({ ok: true, scenePath, narrativePath }, null, 2))
}

main()
