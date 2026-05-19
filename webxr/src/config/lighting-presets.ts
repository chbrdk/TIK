/** Maps scene_config lighting_preset → simple Three.js light tuning. */
export interface LightingPreset {
  ambient: number
  directional: number
  color: string
  background: string
}

export const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  morning_warm: {
    ambient: 0.4,
    directional: 1.0,
    color: '#ffe8cc',
    background: '#1a1410',
  },
  midday_neutral: {
    ambient: 0.45,
    directional: 1.1,
    color: '#ffffff',
    background: '#121418',
  },
  evening_warm: {
    ambient: 0.32,
    directional: 0.85,
    color: '#ffcba4',
    background: '#140f12',
  },
  void_minimal: {
    ambient: 0.2,
    directional: 0.3,
    color: '#aabbff',
    background: '#050508',
  },
}

export function lightingForPreset(preset: string | undefined): LightingPreset {
  return LIGHTING_PRESETS[preset ?? 'morning_warm'] ?? LIGHTING_PRESETS.morning_warm
}
