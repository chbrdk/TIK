import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { beatsForAct, environmentForAct } from '@/runtime/SceneConfigLoader'
import { sceneConfigSchema } from '@/schema/scene-config'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const golden = JSON.parse(
  readFileSync(join(root, 'fixtures/golden/klaus_dortmund_de.json'), 'utf-8'),
)

describe('golden scene_config', () => {
  const config = sceneConfigSchema.parse(golden)

  it('has act 2 kitchen environment', () => {
    const env = environmentForAct(config, 2)
    expect(env?.environment_id).toBe('env_kitchen_lived_in_dach_v1')
  })

  it('has pickup beat on phone_main', () => {
    const beats = beatsForAct(config, 2)
    const pickup = beats.find((b) => b.trigger_type === 'pickup' && b.trigger_target === 'phone_main')
    expect(pickup?.ui_overlay?.type).toBe('news_feed')
  })

  it('has look_at beat on monitor_left for act 3', () => {
    const beats = beatsForAct(config, 3)
    const look = beats.find((b) => b.trigger_type === 'look_at' && b.trigger_target === 'monitor_left')
    expect(look?.ui_overlay?.type).toBe('dashboard')
    expect(look?.voiceover_track_id).toBe('nova_de_act3_02')
    expect(look?.lines?.length).toBeGreaterThan(0)
  })
})
