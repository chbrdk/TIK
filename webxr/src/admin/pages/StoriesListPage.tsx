import { useCallback, useEffect, useState } from 'react'
import { Link } from 'wouter'
import { previewRuntimeUrl } from '@/config/studio'
import { listPersonas, type PersonaSummary } from '../api/pipelineClient'

export function StoriesListPage() {
  const [stories, setStories] = useState<PersonaSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setStories(await listPersonas())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="studio-main studio-main-wide">
      <h2>Stories</h2>
      <p className="studio-lead">
        Fertige Golden-Sessions aus <code>fixtures/golden/</code>. Mit{' '}
        <strong>VR starten</strong> öffnest du die Quest-Runtime; Details zeigen Acts,
        Szenen-Vorschauen und NOVA-Texte.
      </p>

      <div className="studio-actions">
        <button
          type="button"
          className="studio-btn secondary"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
        <Link href="/" className="studio-btn secondary">
          Neue Session
        </Link>
      </div>

      {error && <p className="studio-error">{error}</p>}

      {!error && stories.length === 0 && !loading && (
        <p className="studio-lead">Keine Golden-Stories — zuerst Pipeline compile + publish.</p>
      )}

      {stories.length > 0 && (
        <table className="studio-table studio-jobs-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Rolle</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id}>
                <td>
                  <strong>{story.display_name ?? story.id}</strong>
                  <div className="studio-cell-sub">
                    <code>{story.id}</code>
                  </div>
                </td>
                <td>{story.occupation ?? '—'}</td>
                <td>
                  {story.published ? (
                    <span className="studio-badge">VR publiziert</span>
                  ) : (
                    <span className="studio-badge studio-badge-muted">nur Golden</span>
                  )}
                  {story.narrative_preview_acts.length > 0 && (
                    <span className="studio-badge">
                      Previews {story.narrative_preview_acts.join(', ')}
                    </span>
                  )}
                </td>
                <td className="studio-story-actions">
                  {story.preview_config_url && (
                    <a
                      href={previewRuntimeUrl(story.preview_config_url)}
                      className="studio-btn studio-btn-primary studio-btn-inline"
                    >
                      VR starten
                    </a>
                  )}
                  <Link href={`/stories/${story.id}`}>Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
