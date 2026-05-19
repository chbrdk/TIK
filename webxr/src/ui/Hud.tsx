import { SESSION_ACTS } from '@/config/environments'

interface Props {
  act: number
  environmentId: string
  environmentName?: string
  splatTier?: string
  fps?: number
  onEnterVr?: () => void
  onExitVr?: () => void
  vrSupported?: boolean
  inVr?: boolean
  desktopPreview?: boolean
  wsStatus?: string
  precacheStatus?: string
  showProps?: boolean
  onToggleProps?: () => void
  onSwitchAct?: (act: number) => void
  onAdvanceAct?: () => void
  canAdvance?: boolean
  sessionComplete?: boolean
  onExportMetrics?: () => void
}

export function Hud({
  act,
  environmentId,
  environmentName,
  splatTier,
  fps,
  onEnterVr,
  onExitVr,
  vrSupported,
  inVr,
  desktopPreview,
  wsStatus,
  precacheStatus,
  showProps,
  onToggleProps,
  onSwitchAct,
  onAdvanceAct,
  canAdvance,
  sessionComplete,
  onExportMetrics,
}: Props) {
  return (
    <div className="hud">
      <div>
        <strong>Persona Reality WebXR</strong>
        <div className="hud-meta">
          Act {act}
          {environmentName ? ` · ${environmentName}` : ''} · {environmentId}
          {splatTier ? ` · ${splatTier}` : ''}
          {fps != null ? ` · ${fps} fps` : ''}
          {inVr ? ' · VR' : desktopPreview ? ' · Desktop' : ''}
          {wsStatus ? ` · WS ${wsStatus}` : ''}
          {precacheStatus ? ` · cache ${precacheStatus}` : ''}
          {sessionComplete ? ' · Session Ende' : ''}
        </div>
      </div>
      <div className="hud-actions">
        {onAdvanceAct && canAdvance && (
          <button type="button" className="hud-btn" onClick={onAdvanceAct}>
            Weiter → Act {act + 1}
          </button>
        )}
        {onSwitchAct &&
          SESSION_ACTS.map((a) => (
            <button
              key={a}
              type="button"
              className={`hud-btn hud-btn--secondary${a === act ? ' hud-btn--active' : ''}`}
              onClick={() => onSwitchAct(a)}
            >
              {a}
            </button>
          ))}
        {onToggleProps && (
          <button type="button" className="hud-btn hud-btn--secondary" onClick={onToggleProps}>
            Props {showProps ? 'on' : 'off'}
          </button>
        )}
        {onExportMetrics && (
          <button type="button" className="hud-btn hud-btn--secondary" onClick={onExportMetrics}>
            FPS log
          </button>
        )}
        {inVr && onExitVr && (
          <button type="button" className="hud-btn hud-btn--secondary" onClick={onExitVr}>
            Exit VR
          </button>
        )}
        {!inVr && vrSupported && onEnterVr && (
          <button type="button" className="hud-btn" onClick={onEnterVr}>
            Enter VR
          </button>
        )}
      </div>
    </div>
  )
}
