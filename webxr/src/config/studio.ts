/** Persona Reality Studio — API base (Vite proxy `/api` → backend :8000). */
function normalizeStudioApiBase(raw: string | undefined): string {
  const trimmed = raw?.trim()
  if (!trimmed) return '/api'
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '')
  }
  const path = trimmed.replace(/\/$/, '')
  return path.startsWith('/') ? path : `/${path}`
}

export const studioApiBase = normalizeStudioApiBase(
  import.meta.env.VITE_STUDIO_API_BASE as string | undefined,
)

export const imageBlasterDevUrl =
  (import.meta.env.VITE_IMAGE_BLASTER_DEV_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://localhost:5174'

export function previewRuntimeUrl(configPath: string): string {
  const q = new URLSearchParams({ config: configPath })
  return `/?${q.toString()}`
}

export function anchorEditorUrl(worldSlug: string): string {
  return `${imageBlasterDevUrl}/${worldSlug}/anchors`
}
