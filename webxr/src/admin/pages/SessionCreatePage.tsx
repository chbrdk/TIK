import { useState } from 'react'
import { Link } from 'wouter'
import { createSession, type JobStatus } from '../api/pipelineClient'

export function SessionCreatePage() {
  const [targetAudience, setTargetAudience] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [language, setLanguage] = useState('de')
  const [personaIdOverride, setPersonaIdOverride] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generateNarrativePreviews, setGenerateNarrativePreviews] = useState(true)
  const [generateWorlds, setGenerateWorlds] = useState(false)
  const [skipExistingPreviews, setSkipExistingPreviews] = useState(true)
  const [skipExistingWorlds, setSkipExistingWorlds] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [startedJob, setStartedJob] = useState<JobStatus | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStartedJob(null)
    setSubmitting(true)
    try {
      const job = await createSession({
        target_audience: targetAudience.trim(),
        company_name: companyName.trim(),
        company_description: companyDescription.trim(),
        company_industry: companyIndustry.trim() || undefined,
        language,
        persona_id: personaIdOverride.trim() || undefined,
        generate_narrative_previews: generateNarrativePreviews,
        generate_worlds: generateWorlds,
        skip_existing_previews: skipExistingPreviews,
        skip_existing_worlds: skipExistingWorlds,
      })
      setStartedJob(job)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="studio-main">
      <h2>Neue Persona-Reality-Session</h2>
      <p style={{ fontSize: '0.875rem', color: '#9aa5b1', marginBottom: '1rem' }}>
        Zielgruppe + Unternehmen eingeben. Die Pipeline erzeugt Persona, Acts und
        Gemini-Szenenbilder — danach im Job prüfen und <strong>Welten generieren</strong> klicken
        (Marble + Publish).
      </p>

      {startedJob && (
        <div className="studio-started-banner">
          <p>
            <strong>Pipeline gestartet:</strong> <code>{startedJob.job_id}</code>
          </p>
          <Link href={`/jobs/${startedJob.job_id}`} className="studio-btn">
            Job-Übersicht öffnen
          </Link>
          <Link href="/jobs" className="studio-btn secondary">
            Alle Jobs
          </Link>
        </div>
      )}

      <form className="studio-form" onSubmit={(e) => void onSubmit(e)}>
        <label htmlFor="target_audience">Zielgruppe</label>
        <textarea
          id="target_audience"
          required
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="Rolle, Branche, Schmerzpunkte, Region …"
        />

        <label htmlFor="company_name">Unternehmen — Name</label>
        <input
          id="company_name"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <label htmlFor="company_description">Unternehmen — Beschreibung</label>
        <textarea
          id="company_description"
          required
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          placeholder="Produkte, Messe-Kontext, Demo-Ziele …"
        />

        <label htmlFor="company_industry">Branche (optional)</label>
        <input
          id="company_industry"
          value={companyIndustry}
          onChange={(e) => setCompanyIndustry(e.target.value)}
          placeholder="industrial_b2b"
        />

        <label htmlFor="language">Sprache</label>
        <input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />

        <div className="row-check">
          <input
            id="generate_narrative_previews"
            type="checkbox"
            checked={generateNarrativePreviews}
            onChange={(e) => setGenerateNarrativePreviews(e.target.checked)}
          />
          <label htmlFor="generate_narrative_previews">
            Szenen-Vorschau (Google Gemini, Acts 2–4) — zur Bewertung vor Marble
          </label>
        </div>

        <div className="row-check">
          <input
            id="skip_existing_previews"
            type="checkbox"
            checked={skipExistingPreviews}
            onChange={(e) => setSkipExistingPreviews(e.target.checked)}
          />
          <label htmlFor="skip_existing_previews">Vorhandene Vorschau-Bilder überspringen</label>
        </div>

        <div className="row-check" style={{ marginTop: '1.25rem' }}>
          <input
            id="show_advanced"
            type="checkbox"
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
          />
          <label htmlFor="show_advanced">Erweitert (optional)</label>
        </div>

        {showAdvanced && (
          <>
            <label htmlFor="persona_id">persona_id — nur bei manueller Vorgabe</label>
            <input
              id="persona_id"
              pattern="^[a-z][a-z0-9_]*$"
              value={personaIdOverride}
              onChange={(e) => setPersonaIdOverride(e.target.value)}
              placeholder="Leer lassen = Agent vergibt snake_case id"
            />
            <div className="row-check">
              <input
                id="generate_worlds"
                type="checkbox"
                checked={generateWorlds}
                onChange={(e) => setGenerateWorlds(e.target.checked)}
              />
              <label htmlFor="generate_worlds">
                Marble sofort mitstarten (ohne Admin-Freigabe)
              </label>
            </div>
            <div className="row-check">
              <input
                id="skip_existing"
                type="checkbox"
                checked={skipExistingWorlds}
                onChange={(e) => setSkipExistingWorlds(e.target.checked)}
              />
              <label htmlFor="skip_existing">Vorhandene SPZ überspringen</label>
            </div>
          </>
        )}

        <button className="studio-btn" type="submit" disabled={submitting}>
          {submitting ? 'Starte Pipeline…' : 'Session erstellen'}
        </button>
        {error && <p className="studio-error">{error}</p>}
      </form>
    </div>
  )
}
