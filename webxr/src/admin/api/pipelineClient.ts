import { studioApiBase } from '@/config/studio'

export interface PipelineSessionRequest {
  /** Omit — Claude generates from Zielgruppe + Company */
  persona_id?: string
  target_audience: string
  company_name: string
  company_description: string
  company_industry?: string
  language?: string
  generate_narrative_previews?: boolean
  generate_worlds?: boolean
  skip_existing_previews?: boolean
  skip_existing_worlds?: boolean
}

export interface JobStep {
  id: string
  label: string
  state: string
  message?: string
}

export interface JobArtifactItem {
  kind: string
  label: string
  path: string
  exists: boolean
  public_url?: string | null
}

export interface JobActSummary {
  act: number
  title_de?: string
  world_slug?: string
  environment_id?: string
}

export interface JobResultSummary {
  display_name?: string
  occupation?: string
  location?: string
  throughline_de?: string
  acts?: JobActSummary[]
}

export interface JobListItem {
  job_id: string
  persona_id: string
  state: string
  company_name: string
  target_audience: string
  language: string
  created_at: string
  updated_at: string
  preview_config_url?: string | null
  error?: string | null
  generate_worlds: boolean
}

export interface JobStatus {
  job_id: string
  persona_id: string
  state: string
  steps: JobStep[]
  error?: string
  preview_config_url?: string
  world_slugs?: string[]
  artifacts?: JobArtifactItem[]
  summary?: JobResultSummary | null
  created_at: string
  updated_at: string
  request: PipelineSessionRequest
  log_tail?: string
}

function apiUrl(path: string): string {
  const base = studioApiBase.endsWith('/v1') ? studioApiBase : `${studioApiBase}/v1`
  const suffix = `/pipeline${path.startsWith('/') ? path : `/${path}`}`
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return `${base}${suffix}`
  }
  return `${base}${suffix}`
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    throw new Error(text.slice(0, 400) || res.statusText)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    const hint = text.trimStart().toLowerCase().startsWith('<!doctype')
      ? 'API lieferte HTML statt JSON. Backend auf :8000 starten und Admin über https://localhost:5173/admin öffnen (Proxy /api).'
      : `Ungültige API-Antwort: ${text.slice(0, 120)}`
    throw new Error(hint)
  }
}

export async function createSession(body: PipelineSessionRequest): Promise<JobStatus> {
  const res = await fetch(apiUrl('/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return readJson<JobStatus>(res)
}

export interface VoiceoverLineView {
  phase: string
  track_suffix?: string | null
  at_sec: number
  pause_after_sec?: number | null
  text: string
}

export interface AnchorPlacementView {
  anchor_id: string
  description?: string | null
}

export interface ActCreativeView {
  act: number
  blueprint_path: string
  exists: boolean
  product_layer?: string | null
  world_slug?: string | null
  environment_id?: string | null
  scene_concept_de?: string | null
  core_message_de?: string | null
  nova_role?: string | null
  voiceover_lines: VoiceoverLineView[]
  beat_duration_sec?: number | null
  prompt_en?: string | null
  negative_prompt?: string | null
  camera_notes?: string | null
  slug_hint?: string | null
  anchor_placements: AnchorPlacementView[]
  world_prompt_resolved?: string | null
  world_prompt_source?: string | null
  preview_image_url?: string | null
}

export interface PersonaActsCreativeResponse {
  persona_id: string
  acts: ActCreativeView[]
}

export async function getJobActsCreative(jobId: string): Promise<PersonaActsCreativeResponse> {
  const res = await fetch(apiUrl(`/jobs/${jobId}/acts`))
  return readJson<PersonaActsCreativeResponse>(res)
}

export interface PersonaSummary {
  id: string
  display_name?: string | null
  language: string
  occupation?: string | null
  published: boolean
  preview_config_url?: string | null
  narrative_preview_acts: number[]
}

export async function listPersonas(): Promise<PersonaSummary[]> {
  const res = await fetch(apiUrl('/personas'))
  return readJson<PersonaSummary[]>(res)
}

export interface VoiceoverLineAudioView {
  text: string
  at_sec: number
  pause_after_sec?: number | null
}

export interface VoiceoverTrackAudioView {
  track_id: string
  act: number | null
  line_count: number
  text_preview: string
  text: string
  lines: VoiceoverLineAudioView[]
  audio_exists: boolean
  audio_url: string | null
  estimated_duration_sec?: number | null
}

export interface VoiceoverAudioStatusResponse {
  persona_id: string
  language: string
  tracks: VoiceoverTrackAudioView[]
  elevenlabs_configured: boolean
}

export interface VoiceoverGenerateResponse {
  persona_id: string
  language: string
  generated: string[]
  skipped: string[]
  errors: Record<string, string>
  tracks: VoiceoverTrackAudioView[]
}

export async function getVoiceoverAudioStatus(
  personaId: string,
  language = 'de',
): Promise<VoiceoverAudioStatusResponse> {
  const res = await fetch(apiUrl(`/personas/${personaId}/voiceover-audio?language=${language}`))
  return readJson<VoiceoverAudioStatusResponse>(res)
}

export async function generateVoiceoverAudio(
  personaId: string,
  body: { language?: string; track_ids?: string[]; force?: boolean } = {},
): Promise<VoiceoverGenerateResponse> {
  const res = await fetch(apiUrl(`/personas/${personaId}/voiceover-audio/generate`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: body.language ?? 'de',
      track_ids: body.track_ids,
      force: body.force ?? false,
    }),
  })
  return readJson<VoiceoverGenerateResponse>(res)
}

export async function getPersonaActsCreative(personaId: string): Promise<PersonaActsCreativeResponse> {
  const res = await fetch(apiUrl(`/personas/${personaId}/acts`))
  return readJson<PersonaActsCreativeResponse>(res)
}

export async function listJobs(): Promise<JobListItem[]> {
  const res = await fetch(apiUrl('/jobs'))
  return readJson<JobListItem[]>(res)
}

export async function getJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(apiUrl(`/jobs/${jobId}`))
  return readJson<JobStatus>(res)
}

export async function getJobLog(jobId: string): Promise<string> {
  const res = await fetch(apiUrl(`/jobs/${jobId}/log`))
  const data = await readJson<{ log: string }>(res)
  return data.log
}

export interface JobRetryRequest {
  from_step?: 'auto' | 'persona' | 'acts' | 'narrative' | 'compile' | 'worlds' | 'full'
}

export async function retryJob(
  jobId: string,
  body: JobRetryRequest = { from_step: 'auto' },
): Promise<JobStatus> {
  const res = await fetch(apiUrl(`/jobs/${jobId}/retry`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return readJson<JobStatus>(res)
}

export async function generateWorlds(jobId: string): Promise<JobStatus> {
  const res = await fetch(apiUrl(`/jobs/${jobId}/generate-worlds`), { method: 'POST' })
  return readJson<JobStatus>(res)
}

export async function resyncWorlds(jobId: string): Promise<JobStatus> {
  const res = await fetch(apiUrl(`/jobs/${jobId}/sync-worlds`), { method: 'POST' })
  return readJson<JobStatus>(res)
}

export function subscribeEvents(
  jobId: string,
  onJob: (job: JobStatus) => void,
  onError?: (err: Event) => void,
): () => void {
  const url = apiUrl(`/jobs/${jobId}/events`)
  const es = new EventSource(url)
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      if (data.job) onJob(data.job as JobStatus)
    } catch {
      /* ignore parse errors */
    }
  }
  es.onerror = (e) => onError?.(e)
  return () => es.close()
}
