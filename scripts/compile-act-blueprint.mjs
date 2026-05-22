#!/usr/bin/env node
/**
 * Compile act_blueprint + persona → runtime bundle (narrative + scene_config slices).
 *
 * Usage:
 *   node scripts/compile-act-blueprint.mjs --act 3 --persona klaus_dortmund
 *   node scripts/compile-act-blueprint.mjs --all --persona klaus_dortmund --out fixtures/generated/klaus_dortmund
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function parseArgs(argv) {
  const opts = {
    act: null,
    all: false,
    persona: 'klaus_dortmund',
    profile: null,
    blueprintSet: 'product-default',
    out: null,
  }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--act') opts.act = Number(argv[++i])
    else if (argv[i] === '--all') opts.all = true
    else if (argv[i] === '--persona') opts.persona = argv[++i]
    else if (argv[i] === '--profile') opts.profile = argv[++i]
    else if (argv[i] === '--blueprint-set') opts.blueprintSet = argv[++i]
    else if (argv[i] === '--out') opts.out = argv[++i]
  }
  return opts
}

function templateVars(persona) {
  return {
    persona,
    company: {
      name: persona.company_name ?? '',
      industry: persona.company_industry ?? '',
    },
  }
}

function interpolate(template, vars) {
  if (typeof template !== 'string') return template
  return template
    .replace(/\{\{persona\.(\w+)\}\}/g, (_, key) => {
      const v = vars.persona[key]
      if (v == null) throw new Error(`Missing persona field: ${key}`)
      return String(v)
    })
    .replace(/\{\{company\.(\w+)\}\}/g, (_, key) => {
      const v = vars.company[key]
      if (v == null) throw new Error(`Missing company field: ${key}`)
      return String(v)
    })
}

function deepInterpolate(value, vars) {
  if (typeof value === 'string') return interpolate(value, vars)
  if (Array.isArray(value)) return value.map((v) => deepInterpolate(v, vars))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = deepInterpolate(v, vars)
    return out
  }
  return value
}

function mergeSessionArcIntoBlueprint(blueprint, profile, act) {
  const arc = profile?.session_arc?.acts?.[String(act)]
  if (!arc) return blueprint

  const bp = structuredClone(blueprint)
  const anchorIds = [
    arc.primary_anchor,
    ...(arc.secondary_anchors ?? []),
  ].filter(Boolean)

  bp.environment = {
    ...bp.environment,
    environment_id: arc.environment_id,
    world_slug: arc.world_slug,
    scene_concept_de: arc.scene_concept_de,
    setting_class: arc.setting_class,
    style_hint: arc.style_hint ?? bp.environment?.style_hint,
    region_hint: arc.region_hint ?? bp.environment?.region_hint,
    time_of_day: arc.time_of_day,
    lighting_preset: arc.lighting_preset,
  }

  bp.interaction = {
    ...bp.interaction,
    trigger_type: arc.trigger_type,
    trigger_target: arc.trigger_target,
    primary_anchor: arc.primary_anchor,
  }

  if (bp.image_prompts?.splat_world) {
    bp.image_prompts.splat_world = {
      ...bp.image_prompts.splat_world,
      slug_hint: arc.world_slug,
      prompt_en: arc.splat_prompt_en ?? bp.image_prompts.splat_world.prompt_en,
      negative_prompt: arc.negative_prompt_en ?? bp.image_prompts.splat_world.negative_prompt,
      anchor_placements: anchorIds.map((anchor_id) => ({
        anchor_id,
        description: `${anchor_id} — from session_arc`,
      })),
    }
  }

  if (arc.dramatic_beat_de && bp.story) {
    bp.story.core_message_de = arc.dramatic_beat_de
  }

  return bp
}

function mergeProfileIntoBlueprint(blueprint, profile, act) {
  let bp = mergeSessionArcIntoBlueprint(blueprint, profile, act)
  const actData = profile?.act_data?.[String(act)]
  const cc = profile?.company_context
  if (!actData && !cc) return bp

  if (bp.act === 2 && bp.data_viz?.mode === 'echeon_feed') {
    const headlines =
      actData?.echeon_feed?.headline_templates ?? cc?.echeon?.headline_templates
    if (headlines) {
      bp.data_viz.echeon_feed = {
        ...bp.data_viz.echeon_feed,
        ...(actData?.echeon_feed ?? {}),
        headline_templates: headlines,
      }
    }
  }

  if (bp.act === 3 && bp.data_viz.mode === 'checkion_chart') {
    const metrics = actData?.checkion_chart?.metrics ?? cc?.checkion?.suggested_metrics
    if (metrics) bp.data_viz.checkion_chart.metrics = metrics
  }

  if (bp.act === 4 && bp.data_viz.mode === 'audion_diegetic') {
    const metrics = actData?.audion_diegetic?.metrics ?? cc?.audion?.suggested_metrics
    if (metrics) bp.data_viz.audion_diegetic.metrics = metrics
  }

  return bp
}

function buildEnvironmentBinding(resolved) {
  const env = resolved.environment
  const isVoid =
    env.setting_class?.startsWith('void') || env.lighting_preset === 'void_minimal'
  return {
    act: resolved.act,
    environment_id: env.environment_id,
    world_slug: env.world_slug,
    lighting_preset: env.lighting_preset,
    time_of_day: env.time_of_day,
    weather: 'clear',
    skybox_id: null,
    kind: isVoid ? 'placeholder' : 'splat',
    scene_concept_de: env.scene_concept_de,
  }
}

function resolveBlueprintSet(opts) {
  const personaDir = join(ROOT, 'fixtures/act-blueprints', opts.persona)
  if (existsSync(join(personaDir, 'act-02.json'))) return opts.persona
  return opts.blueprintSet
}

function loadProfile(profileId) {
  const path = join(ROOT, 'fixtures/persona-profiles', `${profileId}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function trackId(act, suffix, language) {
  return `nova_${language}_act${act}_${suffix}`
}

function buildVoiceoverTracks(blueprint, persona) {
  const vars = templateVars(persona)
  const lang = blueprint.meta.language
  const act = blueprint.act
  const tracks = {}

  for (const t of blueprint.voiceover.pre_beat_tracks) {
    const id = trackId(act, t.track_id_suffix, lang)
    tracks[id] = {
      speaker: 'nova',
      estimated_duration_sec: t.estimated_duration_sec,
      lines: deepInterpolate(t.lines, vars),
    }
  }

  const beat = blueprint.voiceover.beat_track
  const beatId = trackId(act, beat.track_id_suffix, lang)
  tracks[beatId] = {
    speaker: 'nova',
    estimated_duration_sec: beat.estimated_duration_sec,
    lines: deepInterpolate(beat.lines, vars),
  }

  return tracks
}

function resolveCues(cues, act, lang, firstPreTrackId, beatTrackId) {
  return cues.map((c) => {
    const cue = { ...c }
    if (cue.track_id === 'PLACEHOLDER') {
      cue.track_id = firstPreTrackId ?? beatTrackId
    }
    if (cue.type === 'subtitle' && !cue.track_id) {
      cue.track_id = firstPreTrackId ?? beatTrackId
    }
    return cue
  })
}

function buildActScript(blueprint, persona, vars = templateVars(persona)) {
  const lang = blueprint.meta.language
  const act = blueprint.act
  const preIds = blueprint.voiceover.pre_beat_tracks.map((t) =>
    trackId(act, t.track_id_suffix, lang),
  )
  const beatId = trackId(act, blueprint.voiceover.beat_track.track_id_suffix, lang)
  const firstPre = preIds[0] ?? null

  const beatKey = beatId
  const beatCueTemplates = {}
  if (blueprint.timeline.beat_cue_templates.length) {
    beatCueTemplates[beatKey] = resolveCues(
      blueprint.timeline.beat_cue_templates,
      act,
      lang,
      firstPre,
      beatId,
    )
  }

  return {
    act,
    target_duration_sec: blueprint.timeline.target_duration_sec,
    ambient_audio_id: blueprint.timeline.ambient_audio_id,
    pre_beat_cues: resolveCues(blueprint.timeline.pre_beat_cues, act, lang, firstPre, beatId),
    beat_cue_templates: beatCueTemplates,
  }
}

function buildNarrativeBeat(blueprint, persona, vars = templateVars(persona)) {
  const lang = blueprint.meta.language
  const act = blueprint.act
  const beatId = trackId(act, blueprint.voiceover.beat_track.track_id_suffix, lang)
  const beatKey = beatId
  const cues = blueprint.timeline.beat_cue_templates.length
    ? resolveCues(blueprint.timeline.beat_cue_templates, act, lang, null, beatId)
    : []

  let ui_overlay = null
  const viz = blueprint.data_viz
  const usesPipelineDiagram = [
    ...(blueprint.timeline?.pre_beat_cues ?? []),
    ...(blueprint.timeline?.beat_cue_templates ?? []),
  ].some((c) => c.type === 'pipeline_diagram')
  if (viz.mode === 'echeon_feed' && !usesPipelineDiagram) {
    ui_overlay = {
      type: 'news_feed',
      anchor_object: blueprint.interaction.primary_anchor,
      payload: { feed_source: 'echeon.feed_items' },
    }
  } else if (viz.mode === 'checkion_chart') {
    ui_overlay = {
      type: 'dashboard',
      anchor_object: blueprint.interaction.primary_anchor,
      payload: { source: 'checkion.metrics' },
    }
  } else if (viz.mode === 'qr_closure') {
    ui_overlay = {
      type: 'qr_code',
      anchor_object: viz.qr_closure?.anchor_object ?? 'qr_panel',
      payload: {},
    }
  }

  return {
    act,
    trigger_type: blueprint.interaction.trigger_type,
    trigger_target: blueprint.interaction.trigger_target,
    delay_sec: blueprint.interaction.delay_sec ?? 0,
    duration_sec: blueprint.timeline.target_duration_sec,
    voiceover_track_id: beatId,
    ambient_audio_id: blueprint.timeline.ambient_audio_id,
    haptic_pattern: blueprint.interaction.haptic_pattern ?? 'none',
    ui_overlay,
    lines: deepInterpolate(blueprint.voiceover.beat_track.lines, vars),
    estimated_duration_sec: blueprint.voiceover.beat_track.estimated_duration_sec,
    cues,
    _beat_cue_template_key: beatKey,
  }
}

function buildDataLayerSlice(blueprint, persona, vars = templateVars(persona)) {
  const viz = blueprint.data_viz
  if (viz.mode === 'echeon_feed') {
    const templates = viz.echeon_feed?.headline_templates ?? []
    const items = templates.slice(0, viz.echeon_feed?.item_count ?? 3).map((headline, i) => ({
      headline: deepInterpolate(headline, vars),
      source: i === 0 ? 'Haufe' : 'SHK Profi',
      category: viz.echeon_feed?.categories?.[i] ?? 'regulation',
      relevance_score: 0.9 - i * 0.05,
      published_at: new Date().toISOString(),
      url: null,
    }))
    return { echeon: { feed_items: items, cache_ttl_sec: 1800 } }
  }
  if (viz.mode === 'checkion_chart' && viz.checkion_chart?.metrics) {
    return {
      checkion: {
        metrics: viz.checkion_chart.metrics.map(({ rationale_de, ...m }) => m),
      },
    }
  }
  if (viz.mode === 'audion_diegetic' && viz.audion_diegetic?.metrics) {
    return {
      audion: {
        diegetic_metrics: viz.audion_diegetic.metrics.map(({ rationale_de, ...m }) => m),
      },
    }
  }
  return {}
}

function compileAct(blueprintPath, personaPath, profile = null) {
  let blueprint = JSON.parse(readFileSync(blueprintPath, 'utf-8'))
  const persona = JSON.parse(readFileSync(personaPath, 'utf-8'))
  if (profile) blueprint = mergeProfileIntoBlueprint(blueprint, profile, blueprint.act)
  const vars = templateVars(persona)
  const resolved = deepInterpolate(blueprint, vars)

  const voiceover_tracks = buildVoiceoverTracks(resolved, persona, vars)
  const act_script = buildActScript(resolved, persona, vars)
  const narrative_beat = buildNarrativeBeat(resolved, persona, vars)
  const data_layer_slice = buildDataLayerSlice(resolved, persona, vars)

  return {
    act: resolved.act,
    blueprint_id: resolved.meta.blueprint_id,
    persona_id: persona.id,
    story: resolved.story,
    image_prompts: resolved.image_prompts,
    environment: resolved.environment,
    scene_environment: buildEnvironmentBinding(resolved),
    voiceover_tracks,
    act_script,
    narrative_beat,
    data_layer_slice,
  }
}

function main() {
  const opts = parseArgs(process.argv)
  const personaPath = join(ROOT, 'fixtures/personas', `${opts.persona}.json`)
  if (!existsSync(personaPath)) {
    console.error(`Persona not found: ${personaPath}`)
    process.exit(1)
  }

  const profileId = opts.profile ?? opts.persona
  const profile = loadProfile(profileId)

  const acts = opts.all ? [1, 2, 3, 4, 5] : [opts.act]
  if (!opts.all && (!opts.act || opts.act < 1 || opts.act > 5)) {
    console.error('Provide --act 1..5 or --all')
    process.exit(1)
  }

  const blueprintSet = resolveBlueprintSet(opts)

  const outDir =
    opts.out ?? join(ROOT, 'fixtures/generated', opts.persona)
  mkdirSync(outDir, { recursive: true })

  const bundles = []
  for (const act of acts) {
    const bpPath = join(
      ROOT,
      'fixtures/act-blueprints',
      blueprintSet,
      `act-0${act}.json`,
    )
    const bundle = compileAct(bpPath, personaPath, profile)
    const file = join(outDir, `act-${String(act).padStart(2, '0')}-bundle.json`)
    writeFileSync(file, `${JSON.stringify(bundle, null, 2)}\n`)
    bundles.push(bundle)
    console.log(`Compiled act ${act} → ${file}`)
  }

  if (opts.all) {
    const environment_bindings = bundles.map((b) => b.scene_environment)
    const envPath = join(outDir, 'environment-bindings.json')
    writeFileSync(envPath, `${JSON.stringify(environment_bindings, null, 2)}\n`)

    const manifest = {
      persona_id: opts.persona,
      acts: bundles.map((b) => b.act),
      environment_bindings,
      voiceover_tracks: Object.assign({}, ...bundles.map((b) => b.voiceover_tracks)),
      act_scripts: bundles.map((b) => b.act_script),
      narrative_beats: bundles.map((b) => {
        const { _beat_cue_template_key, ...beat } = b.narrative_beat
        return beat
      }),
      data_layer_slices: bundles.map((b) => b.data_layer_slice),
      image_prompts_by_act: Object.fromEntries(
        bundles.map((b) => [b.act, b.image_prompts]),
      ),
    }
    const summaryPath = join(outDir, 'session-act-manifest.json')
    writeFileSync(summaryPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`Summary → ${summaryPath}`)
  }
}

main()
