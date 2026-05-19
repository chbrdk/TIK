import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import fs from 'fs'

const repoRoot = path.resolve(__dirname, '..')
const blasterWorlds = path.resolve(
  process.env.IMAGE_BLASTER_ROOT ?? path.join(repoRoot, '..', 'image-blaster'),
  'worlds',
)
const publicWorlds = path.resolve(__dirname, 'public/worlds')

/** Serve image-blaster worlds in dev without copying multi-GB assets. */
function blasterWorldsPlugin() {
  return {
    name: 'blaster-worlds',
    configureServer(server: import('vite').ViteDevServer) {
      const mime: Record<string, string> = {
        '.spz': 'application/octet-stream',
        '.glb': 'model/gltf-binary',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.json': 'application/json',
      }
      server.middlewares.use('/worlds', (req, res, next) => {
        const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
        const candidates = [
          path.resolve(blasterWorlds, `.${urlPath}`),
          path.resolve(publicWorlds, `.${urlPath}`),
        ]
        const filePath = candidates.find(
          (p) =>
            (p.startsWith(blasterWorlds) || p.startsWith(publicWorlds)) &&
            fs.existsSync(p) &&
            fs.statSync(p).isFile(),
        )
        if (!filePath) {
          if (path.extname(urlPath)) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
          next()
          return
        }
        res.setHeader('Content-Type', mime[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), basicSsl(), blasterWorldsPlugin()],
  server: {
    host: true,
    fs: { allow: [repoRoot, blasterWorlds] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
