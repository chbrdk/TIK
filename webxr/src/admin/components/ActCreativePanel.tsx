import { useEffect, useState } from 'react'
import {
  getJobActsCreative,
  getPersonaActsCreative,
  type ActCreativeView,
  type PersonaActsCreativeResponse,
} from '../api/pipelineClient'

function ActBlock({ act }: { act: ActCreativeView }) {
  if (!act.exists) {
    return (
      <article className="studio-act-card studio-act-missing">
        <h4>Act {act.act}</h4>
        <p className="studio-hint">Blueprint fehlt: <code>{act.blueprint_path}</code></p>
      </article>
    )
  }

  return (
    <article className="studio-act-card">
      <header className="studio-act-header">
        <h4>
          Act {act.act}
          {act.product_layer && (
            <span className="studio-badge">{act.product_layer}</span>
          )}
        </h4>
        {act.world_slug && (
          <code className="studio-act-slug">{act.world_slug}</code>
        )}
      </header>

      {act.core_message_de && (
        <p className="studio-act-lead">{act.core_message_de}</p>
      )}
      {act.scene_concept_de && (
        <p className="studio-act-scene">
          <strong>Szene:</strong> {act.scene_concept_de}
        </p>
      )}

      {act.voiceover_lines.length > 0 && (
        <div className="studio-act-block">
          <h5>Sprechertexte (NOVA)</h5>
          <ul className="studio-voiceover-list">
            {act.voiceover_lines.map((line, i) => (
              <li key={`${line.phase}-${line.at_sec}-${i}`}>
                <span className="studio-vo-meta">
                  {line.phase === 'pre_beat' ? 'Pre-Beat' : 'Beat'} · {line.at_sec}s
                  {line.track_suffix ? ` · Track ${line.track_suffix}` : ''}
                </span>
                <span className="studio-vo-text">{line.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {act.preview_image_url && (
        <div className="studio-act-block">
          <h5>Szenen-Vorschau (Gemini)</h5>
          <a href={act.preview_image_url} target="_blank" rel="noreferrer">
            <img
              className="studio-preview-img"
              src={act.preview_image_url}
              alt={`Act ${act.act} preview`}
            />
          </a>
        </div>
      )}

      {(act.prompt_en || act.world_prompt_resolved) && (
        <div className="studio-act-block">
          <h5>World / Splat-Prompt</h5>
          {act.world_prompt_source && (
            <p className="studio-hint">Quelle für Marble: {act.world_prompt_source}</p>
          )}
          <pre className="studio-prompt-box">
            {act.world_prompt_resolved || act.prompt_en}
          </pre>
          {act.negative_prompt && (
            <p className="studio-hint">
              <strong>Negative:</strong> {act.negative_prompt}
            </p>
          )}
          {act.camera_notes && (
            <p className="studio-hint">
              <strong>Kamera:</strong> {act.camera_notes}
            </p>
          )}
        </div>
      )}

      {act.anchor_placements.length > 0 && (
        <div className="studio-act-block">
          <h5>Anker</h5>
          <ul className="studio-anchor-list">
            {act.anchor_placements.map((a) => (
              <li key={a.anchor_id}>
                <code>{a.anchor_id}</code>
                {a.description && ` — ${a.description}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

export function ActCreativePanel({
  jobId,
  personaId,
  actsStepDone = true,
}: {
  jobId?: string
  personaId: string
  actsStepDone?: boolean
}) {
  const [data, setData] = useState<PersonaActsCreativeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!actsStepDone || personaId === 'pending') {
      setData(null)
      return
    }
    setLoading(true)
    const load = jobId ? getJobActsCreative(jobId) : getPersonaActsCreative(personaId)
    void load
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e))
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [jobId, personaId, actsStepDone])

  if (personaId === 'pending') {
    return (
      <section className="studio-section">
        <h3>Acts — Sprecher & Welten</h3>
        <p className="studio-hint">Verfügbar nach dem Persona-Schritt.</p>
      </section>
    )
  }

  if (!actsStepDone) {
    return (
      <section className="studio-section">
        <h3>Acts — Sprecher & Welten</h3>
        <p className="studio-hint">Wird geladen, sobald Act-Blueprints fertig sind…</p>
      </section>
    )
  }

  return (
    <section className="studio-section">
      <h3>Acts — Sprecher & Welten</h3>
      <p className="studio-hint">
        Inhalt aus <code>fixtures/act-blueprints/{personaId}/</code> — World-Prompt wie bei
        Marble-Generierung.
      </p>
      {loading && <p className="studio-hint">Lädt…</p>}
      {error && <p className="studio-error">{error}</p>}
      {data && (
        <div className="studio-act-grid">
          {data.acts.filter((a) => a.exists).map((act) => (
            <ActBlock key={act.act} act={act} />
          ))}
        </div>
      )}
    </section>
  )
}
