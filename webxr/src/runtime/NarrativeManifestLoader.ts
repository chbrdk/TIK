import { narrativeManifestSchema, type NarrativeManifest } from '@/schema/narrative-manifest'

const DEFAULT_URL = '/narrative/klaus_dortmund_de.json'

export async function loadNarrativeManifest(url = DEFAULT_URL): Promise<NarrativeManifest> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`narrative manifest fetch failed: ${response.status}`)
  const json: unknown = await response.json()
  return narrativeManifestSchema.parse(json)
}

export function actScriptFor(manifest: NarrativeManifest, act: number) {
  return manifest.act_scripts.find((s) => s.act === act)
}
