interface Props {
  hint: string
  onEnterVr?: () => void
  vrSupported?: boolean
  onCollapse?: () => void
}

/** Compact controls hint while testing in the browser (no headset). */
export function DesktopHelpBar({ hint, onEnterVr, vrSupported, onCollapse }: Props) {
  return (
    <div className="desktop-help" role="complementary" aria-label="Browser-Vorschau">
      <div className="desktop-help-inner">
        <p className="desktop-help-title">Browser-Vorschau</p>
        <p className="desktop-help-keys">
          Maus: drehen · Scroll: Zoom · <strong>Klick</strong> auf Kugeln/Props ·{' '}
          <kbd>1</kbd>–<kbd>5</kbd> Acts · <kbd>N</kbd> weiter · <kbd>M</kbd> Monitor (Act 3) ·{' '}
          <kbd>Esc</kbd> Panel zu
        </p>
        {hint && <p className="desktop-help-hint">{hint}</p>}
        <div className="desktop-help-actions">
          {vrSupported && onEnterVr && (
            <button type="button" className="hud-btn" onClick={onEnterVr}>
              In VR starten
            </button>
          )}
          {onCollapse && (
            <button type="button" className="hud-btn hud-btn--secondary" onClick={onCollapse}>
              Hinweis ausblenden
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
