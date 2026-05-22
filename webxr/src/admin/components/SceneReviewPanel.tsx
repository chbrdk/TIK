import { useEffect, useState } from 'react'
import {
  getJobActsCreative,
  getPersonaActsCreative,
  type ActCreativeView,
  type PersonaActsCreativeResponse,
} from '../api/pipelineClient'

const PREVIEW_ACTS = [2, 3, 4]

function PreviewCard({ act }: { act: ActCreativeView }) {
  if (!act.preview_image_url) return null
  return (
    <figure className="studio-scene-card">
      <figcaption>
        <strong>Act {act.act}</strong>
        {act.world_slug && <code>{act.world_slug}</code>}
      </figcaption>
      <a
        className="studio-scene-img-link"
        href={act.preview_image_url}
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="studio-scene-img"
          src={act.preview_image_url}
          alt={`Act ${act.act} Szenen-Vorschau`}
          loading="lazy"
        />
      </a>
      {act.scene_concept_de && (
        <p className="studio-scene-caption">{act.scene_concept_de}</p>
      )}
    </figure>
  )
}

export function SceneReviewPanel({
  jobId,
  personaId,
  narrativeDone,
}: {
  jobId?: string
  personaId: string
  narrativeDone: boolean
}) {
  const [data, setData] = useState<PersonaActsCreativeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!narrativeDone || personaId === 'pending') {
      setData(null)
      return
    }
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
  }, [jobId, personaId, narrativeDone])

  if (personaId === 'pending') return null
  if (!narrativeDone) {
    return (
      <section className="studio-section studio-scene-review">
        <h3>Szenen-Freigabe</h3>
        <p className="studio-hint">Vorschau-Bilder erscheinen nach Schritt „Szenen-Vorschau (Gemini)“.</p>
      </section>
    )
  }

  const previewActs =
    data?.acts.filter((a) => PREVIEW_ACTS.includes(a.act) && a.preview_image_url) ?? []
  const missing = PREVIEW_ACTS.filter(
    (n) => !previewActs.some((a) => a.act === n),
  )

  return (
    <section className="studio-section studio-scene-review">
      <h3>Szenen-Freigabe</h3>
      <p className="studio-lead">
        Diese Gemini-Bilder sind die <strong>Referenz für Marble</strong> (Acts 2–4). Wenn die
        Szenen passen, unten auf <strong>Welten generieren</strong> klicken — dann entstehen die
        360°-Welten und die Session wird ins WebXR publiziert.
      </p>
      {error && <p className="studio-error">{error}</p>}
      {previewActs.length > 0 ? (
        <div className="studio-scene-gallery">
          {previewActs.map((act) => (
            <PreviewCard key={act.act} act={act} />
          ))}
        </div>
      ) : (
        <p className="studio-hint">Noch keine Vorschau-Bilder — Pipeline-Schritt narrative prüfen.</p>
      )}
      {missing.length > 0 && (
        <p className="studio-hint">Fehlende Vorschau: Act {missing.join(', ')}</p>
      )}
    </section>
  )
}
