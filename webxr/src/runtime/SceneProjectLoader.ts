import { sceneProjectUrl } from '@/config/environments'
import { sceneProjectSchema, type SceneProject } from '@/schema/scene-project'

export function glbUrlFromAssetId(assetId: string): string {
  const parts = assetId.split('/')
  const slug = parts[0] ?? 'tik-kitchen-pilot'
  const objectSlug = parts[1] ?? 'object'
  const index = parts[2] ?? '0'
  return `/worlds/${slug}/output/${objectSlug}/${index}-${objectSlug}.glb`
}

export async function loadSceneProjectForSlug(slug: string): Promise<SceneProject | null> {
  const url = sceneProjectUrl(slug)
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return null
    return sceneProjectSchema.parse(await response.json())
  } catch {
    return null
  }
}
