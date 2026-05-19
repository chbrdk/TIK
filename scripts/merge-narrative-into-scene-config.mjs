#!/usr/bin/env node
/**
 * Merges fixtures/narrative/*.json into scene_config narrative_beats.
 * Usage: node scripts/merge-narrative-into-scene-config.mjs [--out path]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const narrativePath = join(ROOT, 'fixtures/narrative/klaus_dortmund_de.json')
const scenePath = join(ROOT, 'fixtures/golden/klaus_dortmund_de.json')
const outArg = process.argv.indexOf('--out')
const outPath =
  outArg >= 0 ? process.argv[outArg + 1] : join(ROOT, 'fixtures/golden/klaus_dortmund_de.json')

const narrative = JSON.parse(readFileSync(narrativePath, 'utf-8'))
const scene = JSON.parse(readFileSync(scenePath, 'utf-8'))

function lineEndSec(line) {
  const pause = line.pause_after_sec ?? 0.4
  return line.at_sec + estimateLineDuration(line.text) + pause
}

function estimateLineDuration(text) {
  const words = text.trim().split(/\s+/).length
  return Math.max(1.5, words / 2.5)
}

function trackDuration(trackId) {
  const track = narrative.voiceover_tracks[trackId]
  if (!track) return 8
  if (track.estimated_duration_sec) return track.estimated_duration_sec
  const ends = track.lines.map(lineEndSec)
  return Math.max(...ends, 0) + 1
}

function actScript(act) {
  return narrative.act_scripts.find((s) => s.act === act)
}

function resolveBeatCues(beat, script) {
  const templates = script?.beat_cue_templates ?? {}
  const template = templates[beat.voiceover_track_id]
  if (!template?.length) return []
  return template.map((c) => ({ ...c }))
}

for (const beat of scene.narrative_beats) {
  const trackId = beat.voiceover_track_id
  const track = narrative.voiceover_tracks[trackId]
  const script = actScript(beat.act)

  if (track) {
    beat.lines = track.lines.map((l) => ({ ...l }))
    beat.estimated_duration_sec = track.estimated_duration_sec ?? trackDuration(trackId)
  }

  const cues = resolveBeatCues(beat, script)
  if (cues.length) beat.cues = cues

  const lineDur = beat.lines?.length ? Math.max(...beat.lines.map(lineEndSec)) + 1.5 : 0
  const beatCueEnd = cues.reduce((max, c) => {
    const t = c.at_sec + (c.delay_from_beat ? 0 : 0)
    return Math.max(max, c.delay_from_beat ? t : t)
  }, 0)
  const templateMax = cues
    .filter((c) => c.delay_from_beat)
    .reduce((max, c) => Math.max(max, c.at_sec), 0)

  beat.duration_sec = Math.max(
    beat.duration_sec ?? 8,
    beat.estimated_duration_sec ?? trackDuration(trackId),
    lineDur,
    templateMax + (beat.estimated_duration_sec ?? 8),
  )
}

// Act 3: monitor beat uses nova_de_act3_02 per narrative plan
const act3Beat = scene.narrative_beats.find((b) => b.act === 3)
if (act3Beat && act3Beat.voiceover_track_id === 'nova_de_act3_01') {
  act3Beat.voiceover_track_id = 'nova_de_act3_02'
  const track = narrative.voiceover_tracks['nova_de_act3_02']
  if (track) {
    act3Beat.lines = track.lines.map((l) => ({ ...l }))
    act3Beat.estimated_duration_sec = track.estimated_duration_sec
    const script = actScript(3)
    const cues = resolveBeatCues(act3Beat, script)
    if (cues.length) act3Beat.cues = cues
  }
}

writeFileSync(outPath, `${JSON.stringify(scene, null, 2)}\n`)
console.log(`Merged narrative → ${outPath}`)
