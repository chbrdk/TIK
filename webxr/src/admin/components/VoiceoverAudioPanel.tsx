import { useCallback, useEffect, useRef, useState } from 'react'
import {
  generateVoiceoverAudio,
  getVoiceoverAudioStatus,
  type VoiceoverAudioStatusResponse,
  type VoiceoverLineAudioView,
  type VoiceoverTrackAudioView,
} from '../api/pipelineClient'

function formatAtSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function TrackCard({
  track,
  onGenerateOne,
  busy,
}: {
  track: VoiceoverTrackAudioView
  onGenerateOne: (trackId: string) => void
  busy: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lines = track.lines ?? []

  function seekToLine(line: VoiceoverLineAudioView) {
    const el = audioRef.current
    if (!el || !track.audio_url) return
    el.currentTime = Math.max(0, line.at_sec)
    void el.play().catch(() => {})
  }

  return (
    <article className="studio-vo-track-card">
      <div className="studio-vo-track-head">
        <div>
          <strong>Act {track.act ?? '—'}</strong>
          <code className="studio-vo-track-id">{track.track_id}</code>
          <span className="studio-cell-sub">{track.line_count} Zeilen</span>
        </div>
        <button
          type="button"
          className="studio-btn secondary studio-btn-inline"
          disabled={busy || !track.text}
          onClick={() => onGenerateOne(track.track_id)}
        >
          {track.audio_exists ? 'Neu generieren' : 'Generieren'}
        </button>
      </div>

      {track.text && <p className="studio-vo-track-script">{track.text}</p>}

      {track.audio_url ? (
        <audio
          ref={audioRef}
          className="studio-audio studio-audio-full"
          controls
          controlsList="nodownload"
          preload="metadata"
          src={track.audio_url}
        />
      ) : (
        <p className="studio-hint">Audio noch nicht generiert.</p>
      )}

      {lines.length > 0 && track.audio_url && (
        <div className="studio-vo-line-jumps" role="group" aria-label="Zu Zeile springen">
          {lines.map((line, i) => (
            <button
              key={`${line.at_sec}-${i}`}
              type="button"
              className="studio-vo-line-jump"
              title={line.text}
              onClick={() => seekToLine(line)}
            >
              <span className="studio-vo-line-jump-time">{formatAtSec(line.at_sec)}</span>
              <span className="studio-vo-line-jump-text">{line.text}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

export function VoiceoverAudioPanel({ personaId }: { personaId: string }) {
  const [data, setData] = useState<VoiceoverAudioStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const refresh = useCallback(async () => {
    if (!personaId || personaId === 'pending') return
    setLoading(true)
    try {
      setData(await getVoiceoverAudioStatus(personaId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [personaId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onGenerate(trackIds?: string[], force = false) {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateVoiceoverAudio(personaId, {
        track_ids: trackIds,
        force,
      })
      setData({
        persona_id: result.persona_id,
        language: result.language,
        tracks: result.tracks,
        elevenlabs_configured: data?.elevenlabs_configured ?? true,
      })
      if (Object.keys(result.errors).length > 0) {
        setError(
          Object.entries(result.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n'),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  if (personaId === 'pending') {
    return (
      <section className="studio-section">
        <h3>NOVA-Sprache (ElevenLabs)</h3>
        <p className="studio-hint">Verfügbar nach dem Persona-Schritt.</p>
      </section>
    )
  }

  const missing = data?.tracks.filter((t) => !t.audio_exists).length ?? 0
  const ready = data?.tracks.filter((t) => t.audio_exists).length ?? 0

  return (
    <section className="studio-section studio-section-voiceover">
      <h3>NOVA-Sprache (ElevenLabs)</h3>
      <p className="studio-hint">
        Volle Breite zum Scrubben; Klick auf eine Zeile springt zur <code>at_sec</code>-Position
        im MP3.
      </p>

      {data && !data.elevenlabs_configured && (
        <p className="studio-error">
          ElevenLabs nicht konfiguriert: <code>ELEVENLABS_API_KEY</code> und{' '}
          <code>ELEVENLABS_VOICE_ID</code> in <code>backend/.env</code> setzen, Backend neu
          starten.
        </p>
      )}

      <div className="studio-actions">
        <button
          type="button"
          className="studio-btn studio-btn-primary"
          disabled={generating || loading || !data?.elevenlabs_configured}
          onClick={() => void onGenerate(undefined, false)}
        >
          {generating ? 'Generiert…' : `Fehlende generieren (${missing})`}
        </button>
        <button
          type="button"
          className="studio-btn secondary"
          disabled={generating || loading || !data?.elevenlabs_configured}
          onClick={() => void onGenerate(undefined, true)}
        >
          Alle neu generieren
        </button>
        <button
          type="button"
          className="studio-btn secondary"
          disabled={loading}
          onClick={() => void refresh()}
        >
          Aktualisieren
        </button>
      </div>

      {data && (
        <p className="studio-hint">
          {ready} von {data.tracks.length} Spuren mit Audio.
        </p>
      )}

      {loading && <p className="studio-hint">Lädt…</p>}
      {error && <p className="studio-error" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}

      {data && data.tracks.length > 0 && (
        <div className="studio-vo-track-list">
          {data.tracks.map((track) => (
            <TrackCard
              key={track.track_id}
              track={track}
              busy={generating}
              onGenerateOne={(id) => void onGenerate([id], true)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
