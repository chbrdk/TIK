/** MSQDX Persona Reality visual tokens (WebXR booth). */
export const visualTokens = {
  brandGreen: '#00ca55',
  brandPurple: '#b638ff',
  brandYellow: '#fef14d',
  surfaceDark: '#0c0c14',
  surfacePanel: '#12141c',
  textPrimary: '#e8ecf4',
  textMuted: '#9aa3b8',
  checkionAccent: '#6eb5ff',
  echeonAccent: '#c77dff',
  novaAccent: '#7cfac0',
} as const

export type DiegeticPresetId = 'glow_warm' | 'pulse_red'

export interface DiegeticPresetStyle {
  accent: string
  ring: string
  pulseHz: number
  pulseAmount: number
}

export function diegeticPresetStyle(preset: string): DiegeticPresetStyle {
  if (preset === 'pulse_red') {
    return {
      accent: '#ff6b6b',
      ring: '#ff4444',
      pulseHz: 4,
      pulseAmount: 0.14,
    }
  }
  return {
    accent: '#ffcba4',
    ring: visualTokens.brandGreen,
    pulseHz: 2,
    pulseAmount: 0.1,
  }
}

export function trendGlyph(trend?: string): string {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}
