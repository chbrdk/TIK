import { describe, expect, it } from 'vitest'
import {
  ENVIRONMENT_REGISTRY,
  KITCHEN_WORLD_SLUG,
  SESSION_ACTS,
  getEnvironmentByAct,
  getEnvironmentById,
  listSplatEnvironments,
} from '@/config/environments'

describe('environments registry', () => {
  it('covers all five golden environment_ids', () => {
    const ids = [
      'env_void_mirror_v1',
      'env_kitchen_lived_in_dach_v1',
      'env_home_office_lived_in_dach_v1',
      'env_home_living_lived_in_dach_v1',
      'env_void_constellation_v1',
    ]
    for (const id of ids) {
      expect(ENVIRONMENT_REGISTRY[id]).toBeDefined()
    }
  })

  it('maps act 2 to digital particle void placeholder', () => {
    const env = getEnvironmentByAct(2)
    expect(env?.environmentId).toBe('env_void_digital_particles_v1')
    expect(env?.placeholderVariant).toBe('void_digital_particles')
    expect(env?.kind).toBe('placeholder')
  })

  it('still exposes kitchen splat by id for other personas', () => {
    expect(getEnvironmentById('env_kitchen_lived_in_dach_v1')?.worldSlug).toBe(KITCHEN_WORLD_SLUG)
    expect(getEnvironmentById('env_kitchen_lived_in_dach_v1')?.kind).toBe('splat')
  })

  it('maps act 3 to office splat', () => {
    expect(getEnvironmentByAct(3)?.worldSlug).toBe('modern-office-360')
    expect(getEnvironmentByAct(3)?.anchors.map((a) => a.id)).toContain('monitor_left')
  })

  it('uses placeholders for acts 1, 4, 5', () => {
    expect(getEnvironmentByAct(1)?.kind).toBe('placeholder')
    expect(getEnvironmentByAct(4)?.kind).toBe('placeholder')
    expect(getEnvironmentByAct(5)?.kind).toBe('placeholder')
  })

  it('session acts are 1 through 5', () => {
    expect([...SESSION_ACTS]).toEqual([1, 2, 3, 4, 5])
  })

  it('lists two splat worlds for precache', () => {
    expect(listSplatEnvironments()).toHaveLength(2)
  })

  it('resolves by environment id', () => {
    expect(getEnvironmentById('env_home_office_lived_in_dach_v1')?.defaultAct).toBe(3)
  })
})
