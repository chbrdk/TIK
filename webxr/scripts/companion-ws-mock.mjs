#!/usr/bin/env node
/**
 * Dev mock: iPad companion pushes golden scene_config over WebSocket.
 * Usage: npm run companion:mock
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const port = Number(process.env.COMPANION_WS_PORT ?? 8765)
const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const goldenPath = join(root, 'fixtures/golden/klaus_dortmund_de.json')
const sceneConfig = JSON.parse(readFileSync(goldenPath, 'utf-8'))

const wss = new WebSocketServer({ port, host: '0.0.0.0' })

wss.on('connection', (ws) => {
  console.log('Quest/client connected')
  ws.send(JSON.stringify({ type: 'scene_config', scene_config: sceneConfig }))
  ws.on('message', (data) => {
    const text = String(data)
    if (text === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
  })
})

console.log(`Companion mock WS → ws://0.0.0.0:${port}`)
console.log('Set VITE_COMPANION_WS_URL=ws://<your-ip>:8765 on Quest if needed')
