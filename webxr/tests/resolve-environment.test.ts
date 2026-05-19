import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolveEnvironmentForAct, splatActsFromConfig } from '@/runtime/resolveEnvironment'
import { sceneConfigSchema } from '@/schema/scene-config'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const golden = JSON.parse(
  readFileSync(join(root, 'fixtures/golden/klaus_dortmund_de.json'), 'utf-8'),
)

describe('resolveEnvironmentForAct', () => {
  const config = sceneConfigSchema.parse(golden)

  it('resolves all five acts from golden config', () => {
    for (let act = 1; act <= 5; act++) {
      const def = resolveEnvironmentForAct(config, act)
      expect(def.environmentId).toBe(
        config.environments.find((e) => e.act === act)?.environment_id,
      )
    }
  })

  it('returns splat for acts 2 and 3', () => {
    expect(resolveEnvironmentForAct(config, 2).kind).toBe('splat')
    expect(resolveEnvironmentForAct(config, 3).kind).toBe('splat')
  })

  it('returns placeholder for acts 1, 4, 5', () => {
    expect(resolveEnvironmentForAct(config, 1).kind).toBe('placeholder')
    expect(resolveEnvironmentForAct(config, 4).kind).toBe('placeholder')
    expect(resolveEnvironmentForAct(config, 5).kind).toBe('placeholder')
  })

  it('lists splat acts for precache', () => {
    expect(splatActsFromConfig(config)).toEqual([2, 3])
  })
})
