import { env } from './env'

/** Resolve world asset URL: dev proxies to image-blaster via /worlds. */
export function worldAssetUrl(slug: string, relativePath: string): string {
  if (relativePath.startsWith('http')) return relativePath
  if (relativePath.startsWith('/worlds/')) return relativePath
  return `/worlds/${slug}/${relativePath.replace(/^\//, '')}`
}

export function devBlasterWorldSplatUrl(
  slug: string,
  tier: '100k' | '150k' | '500k' | 'full_res' = '150k',
): string {
  return `/worlds/${slug}/output/world/0-world-${tier}.spz`
}
