import { useCallback, useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { previewRuntimeUrl } from '@/config/studio'
import { ActCreativePanel } from '../components/ActCreativePanel'
import { SceneReviewPanel } from '../components/SceneReviewPanel'
import { VoiceoverAudioPanel } from '../components/VoiceoverAudioPanel'
import { getPersonaActsCreative, listPersonas, type PersonaSummary } from '../api/pipelineClient'

export function StoryDetailPage() {
  const [, params] = useRoute('/stories/:personaId')
  const personaId = params?.personaId ?? ''
  const [story, setStory] = useState<PersonaSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPreviews, setHasPreviews] = useState(false)

  const load = useCallback(async () => {
    if (!personaId) return
    try {
      const stories = await listPersonas()
      const row = stories.find((s) => s.id === personaId) ?? null
      setStory(row)
      setError(row ? null : `Story nicht gefunden: ${personaId}`)
      if (row) {
        const creative = await getPersonaActsCreative(personaId)
        setHasPreviews(
          creative.acts.some((a) => a.preview_image_url && [2, 3, 4].includes(a.act)),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [personaId])

  useEffect(() => {
    void load()
  }, [load])

  if (!personaId) return <p className="studio-error">Keine Persona-ID</p>
  if (error && !story) return <p className="studio-error">{error}</p>
  if (!story) return <p className="studio-main">Lade Story…</p>

  return (
    <div className="studio-main studio-main-wide">
      <p className="studio-breadcrumb">
        <Link href="/stories">Stories</Link> → <code>{personaId}</code>
      </p>
      <h2>{story.display_name ?? personaId}</h2>
      {story.occupation && <p className="studio-lead">{story.occupation}</p>}

      <div className="studio-actions">
        {story.preview_config_url ? (
          <a
            href={previewRuntimeUrl(story.preview_config_url)}
            className="studio-btn studio-btn-primary"
          >
            VR starten
          </a>
        ) : (
          <span className="studio-hint">
            Noch nicht nach <code>webxr/public/scene_configs/</code> publiziert —{' '}
            <code>node scripts/publish-session-to-webxr.mjs --profile {personaId}</code>
          </span>
        )}
        <Link href="/stories" className="studio-btn secondary">
          Alle Stories
        </Link>
      </div>

      <SceneReviewPanel personaId={personaId} narrativeDone={hasPreviews} />

      <VoiceoverAudioPanel personaId={personaId} />

      <ActCreativePanel personaId={personaId} actsStepDone />
    </div>
  )
}
