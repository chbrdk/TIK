import { describe, expect, it } from 'vitest'
import { anchorEditorUrl, previewRuntimeUrl } from '@/config/studio'

describe('studio URLs', () => {
  it('builds preview runtime URL with config query', () => {
    expect(previewRuntimeUrl('/scene_configs/foo_de.json')).toBe(
      '/?config=%2Fscene_configs%2Ffoo_de.json',
    )
  })

  it('builds anchor editor URL', () => {
    expect(anchorEditorUrl('sick-filling-line')).toMatch(/sick-filling-line\/anchors$/)
  })
})
