import { useCallback, useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { anchorEditorUrl, previewRuntimeUrl } from '@/config/studio'
import { ActCreativePanel } from '../components/ActCreativePanel'
import { SceneReviewPanel } from '../components/SceneReviewPanel'
import { VoiceoverAudioPanel } from '../components/VoiceoverAudioPanel'
import {
  generateWorlds,
  retryJob,
  getJob,
  getJobLog,
  resyncWorlds,
  subscribeEvents,
  type JobArtifactItem,
  type JobStatus,
} from '../api/pipelineClient'

function ArtifactRow({ item }: { item: JobArtifactItem }) {
  return (
    <tr className={item.exists ? 'studio-artifact-ok' : 'studio-artifact-missing'}>
      <td>{item.label}</td>
      <td>
        <code className="studio-path">{item.path}</code>
      </td>
      <td>{item.exists ? '✓' : '—'}</td>
      <td>
        {item.public_url ? (
          <a href={item.public_url} target="_blank" rel="noreferrer">
            öffnen
          </a>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

export function JobDetailPage() {
  const [, params] = useRoute('/jobs/:jobId')
  const jobId = params?.jobId ?? ''
  const [job, setJob] = useState<JobStatus | null>(null)
  const [fullLog, setFullLog] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [generatingWorlds, setGeneratingWorlds] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const refresh = useCallback(async () => {
    if (!jobId) return
    try {
      const j = await getJob(jobId)
      setJob(j)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [jobId])

  useEffect(() => {
    void refresh()
    if (!jobId) return
    const unsub = subscribeEvents(jobId, setJob)
    const t = setInterval(() => void refresh(), 4000)
    return () => {
      unsub()
      clearInterval(t)
    }
  }, [jobId, refresh])

  useEffect(() => {
    if (!jobId) return
    void getJobLog(jobId)
      .then(setFullLog)
      .catch(() => setFullLog(null))
  }, [jobId, job?.updated_at])

  async function onRetry(fromStep: 'auto' | 'acts' | 'full' = 'auto') {
    if (!jobId) return
    setRetrying(true)
    setError(null)
    try {
      setJob(await retryJob(jobId, { from_step: fromStep }))
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRetrying(false)
    }
  }

  async function onGenerateWorlds() {
    if (!jobId) return
    setGeneratingWorlds(true)
    setError(null)
    try {
      setJob(await generateWorlds(jobId))
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGeneratingWorlds(false)
    }
  }

  async function onResync() {
    setSyncing(true)
    try {
      setJob(await resyncWorlds(jobId))
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSyncing(false)
    }
  }

  if (!jobId) return <p className="studio-error">Keine Job-ID</p>
  if (!job) return <p className="studio-main">Lade Job…</p>

  const pid =
    job.persona_id !== 'pending'
      ? job.persona_id
      : (job.steps.find((s) => s.id === 'persona')?.message?.match(/persona_id:\s*(\S+)/)?.[1] ??
        'pending')
  const isPending = pid === 'pending'
  const narrativeStep = job.steps.find((s) => s.id === 'narrative')
  const narrativeDone =
    !isPending &&
    (narrativeStep?.state === 'completed' ||
      ['awaiting_worlds', 'worlds', 'publish', 'completed'].includes(job.state))
  const compileDone = job.steps.find((s) => s.id === 'compile')?.state === 'completed'
  const canGenerateWorlds =
    !isPending &&
    compileDone &&
    (job.state === 'awaiting_worlds' || job.state === 'failed')
  const canRetry =
    !['persona', 'acts', 'narrative', 'compile', 'worlds', 'publish'].includes(job.state)
  const canRetryActs = canRetry && !isPending && job.steps.find((s) => s.id === 'persona')?.state === 'completed'
  const worldsRunning = job.state === 'worlds' || job.state === 'publish'
  const pipelineRunning = ['persona', 'acts', 'narrative', 'compile', 'queued'].includes(job.state)
  const actsStepState = job.steps.find((s) => s.id === 'acts')?.state ?? ''
  const actsStepDone =
    !isPending &&
    (actsStepState === 'completed' ||
      narrativeDone ||
      ['compile', 'worlds', 'publish', 'completed', 'failed', 'awaiting_worlds'].includes(
        job.state,
      ))
  const canPreview =
    job.state === 'completed' && !isPending && Boolean(job.preview_config_url)
  const previewPath = job.preview_config_url ?? ''
  const artifacts = job.artifacts ?? []
  const summary = job.summary
  const req = job.request

  return (
    <div className="studio-main studio-main-wide">
      <h2>
        Pipeline-Job{' '}
        <span className={`studio-state-badge studio-state-${job.state}`}>{job.state}</span>
      </h2>
      <p className="studio-lead">
        Ablauf: Persona → Acts → <strong>Szenen-Vorschau prüfen</strong> → optional Marble →
        WebXR-Publish.
      </p>

      {(canRetry || canGenerateWorlds) && (
        <section className="studio-section studio-cta-box">
          <h3>Aktionen</h3>
          {job.state === 'failed' && job.error && (
            <p className="studio-error" style={{ marginTop: 0 }}>
              {job.error}
            </p>
          )}
          <div className="studio-cta-actions">
            {canRetry && (
              <button
                type="button"
                className="studio-btn"
                disabled={retrying || pipelineRunning || generatingWorlds}
                onClick={() => void onRetry('auto')}
              >
                {retrying ? 'Startet…' : 'Job erneut ausführen'}
              </button>
            )}
            {canRetryActs && (
              <button
                type="button"
                className="studio-btn secondary"
                disabled={retrying || pipelineRunning || generatingWorlds}
                onClick={() => void onRetry('acts')}
              >
                Ab Acts neu
              </button>
            )}
            {canGenerateWorlds && (
              <button
                type="button"
                className="studio-btn studio-btn-primary"
                disabled={generatingWorlds || worldsRunning || retrying}
                onClick={() => void onGenerateWorlds()}
              >
                {generatingWorlds || worldsRunning
                  ? 'Welten werden generiert…'
                  : 'Welten generieren & publizieren'}
              </button>
            )}
          </div>
          {canGenerateWorlds && (
            <p className="studio-hint">
              Marble nutzt die Gemini-Vorschau-Bilder als Quellfoto plus den Splat-Prompt.
            </p>
          )}
        </section>
      )}

      <SceneReviewPanel
        jobId={jobId}
        personaId={pid}
        narrativeDone={narrativeDone}
      />

      <VoiceoverAudioPanel personaId={pid} />

      <section className="studio-section">
        <h3>Eingaben</h3>
        <dl className="studio-dl">
          <dt>Unternehmen</dt>
          <dd>{req.company_name}</dd>
          <dt>Zielgruppe</dt>
          <dd>{req.target_audience}</dd>
          <dt>Beschreibung</dt>
          <dd>{req.company_description}</dd>
          {req.company_industry && (
            <>
              <dt>Branche</dt>
              <dd>{req.company_industry}</dd>
            </>
          )}
          <dt>Sprache</dt>
          <dd>{req.language ?? 'de'}</dd>
          <dt>Szenen-Vorschau</dt>
          <dd>{req.generate_narrative_previews !== false ? 'ja (Google Gemini)' : 'nein'}</dd>
        </dl>
      </section>

      <section className="studio-section">
        <h3>Persona</h3>
        <p>
          <code>{isPending ? 'wird vom Agenten vergeben…' : pid}</code>
        </p>
        {summary && (
          <dl className="studio-dl">
            <dt>Name</dt>
            <dd>
              {summary.display_name}
              {summary.occupation && ` · ${summary.occupation}`}
              {summary.location && ` · ${summary.location}`}
            </dd>
            {summary.throughline_de && (
              <>
                <dt>Throughline</dt>
                <dd>{summary.throughline_de}</dd>
              </>
            )}
          </dl>
        )}
        {summary?.acts && summary.acts.length > 0 && (
          <table className="studio-table">
            <thead>
              <tr>
                <th>Act</th>
                <th>Titel</th>
                <th>Welt</th>
              </tr>
            </thead>
            <tbody>
              {summary.acts.map((a) => (
                <tr key={a.act}>
                  <td>{a.act}</td>
                  <td>{a.title_de ?? '—'}</td>
                  <td>
                    <code>{a.world_slug ?? '—'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ActCreativePanel jobId={jobId} personaId={pid} actsStepDone={actsStepDone} />

      <section className="studio-section">
        <h3>Pipeline-Schritte</h3>
        <ul className="studio-steps">
          {job.steps.map((s) => (
            <li key={s.id}>
              <strong>{s.label}</strong>{' '}
              <span className="state">{s.state}</span>
              {s.message && <div className="state">{s.message}</div>}
            </li>
          ))}
        </ul>
        {job.error && <p className="studio-error">{job.error}</p>}
      </section>

      {artifacts.length > 0 && (
        <section className="studio-section">
          <h3>Erzeugte Artefakte</h3>
          <p className="studio-hint">
            Pfade relativ zum TIK-Repo. „öffentlich“ = im WebXR-Dev-Server abrufbar.
          </p>
          <table className="studio-table">
            <thead>
              <tr>
                <th>Was</th>
                <th>Datei</th>
                <th>OK</th>
                <th>öffentlich</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((item) => (
                <ArtifactRow key={`${item.kind}-${item.path}`} item={item} />
              ))}
            </tbody>
          </table>
        </section>
      )}

      {canPreview && (
        <section className="studio-section studio-preview-box">
          <h3>VR-Preview</h3>
          <p className="studio-hint">
            Lädt genau diese Session: <code>{previewPath}</code>
          </p>
          <a
            className="studio-btn"
            href={previewRuntimeUrl(previewPath)}
            target="_blank"
            rel="noreferrer"
          >
            {pid} in Runtime testen
          </a>
          {(job.world_slugs ?? []).map((slug) => (
            <a
              key={slug}
              className="studio-btn secondary"
              href={anchorEditorUrl(slug)}
              target="_blank"
              rel="noreferrer"
            >
              Anker: {slug}
            </a>
          ))}
        </section>
      )}

      <div className="studio-actions">
        <Link href="/jobs" className="studio-btn secondary">
          ← Alle Jobs
        </Link>
        {job.state === 'completed' && (
          <button
            type="button"
            className="studio-btn secondary"
            disabled={syncing}
            onClick={() => void onResync()}
          >
            {syncing ? 'Sync…' : 'Welten erneut syncen'}
          </button>
        )}
        <Link href="/" replace className="studio-btn secondary">
          Neue Session
        </Link>
      </div>

      <section className="studio-section">
        <h3>Log</h3>
        <pre className="studio-log">{fullLog ?? job.log_tail ?? '(noch kein Log)'}</pre>
      </section>

      {error && <p className="studio-error">{error}</p>}
    </div>
  )
}
