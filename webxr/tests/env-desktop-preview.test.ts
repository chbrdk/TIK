import { describe, expect, it } from 'vitest'
import { DESKTOP_PREVIEW_STORAGE_KEY } from '@/config/env'

describe('desktop preview env', () => {
  it('storage key is stable', () => {
    expect(DESKTOP_PREVIEW_STORAGE_KEY).toBe('tik-desktop-preview')
  })
})
