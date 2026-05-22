import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { listJobs, type JobListItem } from '../api/pipelineClient'

const STATE_LABELS: Record<string, string> = {
  queued: 'Warteschlange',
  persona: 'Persona',
  acts: 'Acts',
  narrative: 'Szenen-Vorschau',
  compile: 'Compile',
  awaiting_worlds: 'Freigabe',
  worlds: 'Welten',
  publish: 'Publish',
  completed: 'Fertig',
  failed: 'Fehler',
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function JobsListPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setJobs(await listJobs())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => void refresh(), 8000)
    return () => clearInterval(t)
  }, [refresh])

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs
    if (filter === 'running') {
      return jobs.filter((j) => !['completed', 'failed', 'queued'].includes(j.state))
    }
    if (filter === 'completed') return jobs.filter((j) => j.state === 'completed')
    return jobs.filter((j) => j.state === 'failed')
  }, [jobs, filter])

  const counts = useMemo(
    () => ({
      all: jobs.length,
      running: jobs.filter((j) => !['completed', 'failed', 'queued'].includes(j.state)).length,
      completed: jobs.filter((j) => j.state === 'completed').length,
      failed: jobs.filter((j) => j.state === 'failed').length,
    }),
    [jobs],
  )

  return (
    <div className="studio-main studio-main-wide">
      <h2>Pipeline-Jobs</h2>
      <p className="studio-lead">
        Alle Studio-Läufe aus <code>fixtures/jobs/</code> — neueste zuerst. Klick öffnet Job-Detail
        mit Artefakten und Log.
      </p>

      <div className="studio-actions">
        <button type="button" className="studio-btn secondary" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
        <Link href="/" className="studio-btn secondary">
          Neue Session
        </Link>
      </div>

      <div className="studio-filter-row">
        {(['all', 'running', 'completed', 'failed'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`studio-filter-btn${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' && `Alle (${counts.all})`}
            {key === 'running' && `Laufend (${counts.running})`}
            {key === 'completed' && `Fertig (${counts.completed})`}
            {key === 'failed' && `Fehler (${counts.failed})`}
          </button>
        ))}
      </div>

      {error && <p className="studio-error">{error}</p>}

      {!error && filtered.length === 0 && !loading && (
        <p className="studio-lead">Noch keine Jobs — starte eine Session unter „Neue Session“.</p>
      )}

      {filtered.length > 0 && (
        <table className="studio-table studio-jobs-table">
          <thead>
            <tr>
              <th>Aktualisiert</th>
              <th>Unternehmen</th>
              <th>Persona</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.job_id}>
                <td>{formatWhen(job.updated_at)}</td>
                <td>
                  <strong>{job.company_name}</strong>
                  <div className="studio-cell-sub">{truncate(job.target_audience, 72)}</div>
                </td>
                <td>
                  <code>{job.persona_id === 'pending' ? '—' : job.persona_id}</code>
                  {job.generate_worlds && <span className="studio-badge">Marble</span>}
                </td>
                <td>
                  <span className={`studio-state studio-state-${job.state}`}>
                    {STATE_LABELS[job.state] ?? job.state}
                  </span>
                  {job.error && (
                    <div className="studio-cell-sub studio-error-inline" title={job.error}>
                      {truncate(job.error, 80)}
                    </div>
                  )}
                </td>
                <td>
                  <Link href={`/jobs/${job.job_id}`}>Details</Link>
                  {job.preview_config_url && job.state === 'completed' && (
                    <>
                      {' · '}
                      <a href={job.preview_config_url} target="_blank" rel="noreferrer">
                        Preview
                      </a>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
