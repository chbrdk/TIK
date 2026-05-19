import { describe, expect, it } from 'vitest'
import { getEnvironmentByAct, requiredAnchorIds } from '@/config/anchors'

describe('anchors', () => {
  it('kitchen requires phone_main', () => {
    const ids = requiredAnchorIds('env_kitchen_lived_in_dach_v1')
    expect(ids).toContain('phone_main')
    expect(ids).toHaveLength(3)
  })

  it('office requires monitor_left', () => {
    const ids = requiredAnchorIds('env_home_office_lived_in_dach_v1')
    expect(ids).toEqual(['monitor_left'])
  })

  it('act 3 environment has office slug', () => {
    expect(getEnvironmentByAct(3)?.worldSlug).toBe('modern-office-360')
  })
})
