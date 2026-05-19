import type { UiOverlay } from '@/schema/scene-config'
import { trendGlyph, visualTokens } from '@/config/visual-tokens'

export interface CheckionMetric {
  label?: string
  value?: number
  unit?: string
  comparison_value?: number | null
  trend?: string
}

interface Props {
  overlay: UiOverlay
  metrics: CheckionMetric[]
  onClose: () => void
}

export function CheckionDashboard({ overlay, metrics, onClose }: Props) {
  if (overlay.type !== 'dashboard') return null

  return (
    <div className="overlay-panel overlay-panel--checkion" role="dialog" aria-label="CHECKION Dashboard">
      <header>
        <span className="overlay-brand" style={{ color: visualTokens.checkionAccent }}>
          CHECKION
        </span>
        <span className="overlay-sub">Visibility Snapshot</span>
        <button type="button" onClick={onClose} aria-label="Schließen">
          ×
        </button>
      </header>
      <div className="checkion-grid">
        {metrics.map((m, i) => {
          const pct = Math.max(0, Math.min(100, m.value ?? 0))
          return (
            <div key={i} className="checkion-card">
              <div className="checkion-card-head">
                <span className="checkion-label">{m.label}</span>
                <span className={`checkion-trend trend-${m.trend ?? 'flat'}`}>
                  {trendGlyph(m.trend)}
                </span>
              </div>
              <span className="checkion-value">
                {m.value}
                {m.unit ?? ''}
              </span>
              {m.comparison_value != null && (
                <span className="checkion-compare">vs {m.comparison_value}{m.unit}</span>
              )}
              <div className="checkion-bar-track">
                <div className="checkion-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
