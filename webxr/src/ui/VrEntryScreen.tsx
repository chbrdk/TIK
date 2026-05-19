interface Props {
  supported: boolean
  loading?: boolean
  error?: string | null
  onEnterVr: () => void
  onStartDesktop: () => void
}

export function VrEntryScreen({
  supported,
  loading,
  error,
  onEnterVr,
  onStartDesktop,
}: Props) {
  return (
    <div className="vr-entry">
      <div className="vr-entry-card">
        <h1>Persona Reality</h1>
        <p className="vr-entry-lead">
          Wähle, wie du starten möchtest — <strong>Browser-Vorschau</strong> zum Entwickeln am
          Desktop oder <strong>VR</strong> auf der Quest.
        </p>
        <button
          type="button"
          className="vr-entry-btn vr-entry-btn--desktop"
          onClick={onStartDesktop}
        >
          Browser-Vorschau starten
        </button>
        <button
          type="button"
          className="vr-entry-btn vr-entry-btn--vr"
          disabled={!supported || loading}
          onClick={onEnterVr}
        >
          {loading ? 'Starte VR…' : 'In VR starten'}
        </button>
        {!supported && (
          <p className="vr-entry-warn">
            WebXR nicht verfügbar — nutze die Browser-Vorschau. Auf Quest: Seite über{' '}
            <strong>https://</strong> öffnen.
          </p>
        )}
        {error && <p className="vr-entry-error">{error}</p>}
        <p className="vr-entry-hint">
          Vorschau: Maus/Scroll · Klick auf Hotspots · Tasten 1–5 und N. VR: Trigger · Grip.
        </p>
      </div>
    </div>
  )
}
