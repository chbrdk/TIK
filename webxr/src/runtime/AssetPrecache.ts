const CACHE_NAME = 'persona-reality-webxr-v1'

export async function precacheUrls(urls: string[]): Promise<{ cached: number; failed: number }> {
  if (!('caches' in window)) return { cached: 0, failed: urls.length }

  const cache = await caches.open(CACHE_NAME)
  let cached = 0
  let failed = 0

  await Promise.all(
    urls.map(async (url) => {
      try {
        const existing = await cache.match(url)
        if (existing) {
          cached += 1
          return
        }
        const response = await fetch(url, { cache: 'reload' })
        if (!response.ok) throw new Error(String(response.status))
        await cache.put(url, response)
        cached += 1
      } catch {
        failed += 1
      }
    }),
  )

  return { cached, failed }
}

export async function fetchWithPrecache(url: string): Promise<Response> {
  if ('caches' in window) {
    const hit = await caches.match(url)
    if (hit) return hit
  }
  const response = await fetch(url)
  if ('caches' in window && response.ok) {
    const cache = await caches.open(CACHE_NAME)
    void cache.put(url, response.clone())
  }
  return response
}
