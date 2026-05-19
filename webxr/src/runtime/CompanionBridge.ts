import { env } from '@/config/env'
import { sceneConfigSchema, type SceneConfig } from '@/schema/scene-config'

export type CompanionMessage =
  | { type: 'scene_config'; scene_config: unknown }
  | { type: 'ping' }
  | { type: 'error'; message: string }

export type CompanionBridgeCallbacks = {
  onSceneConfig: (config: SceneConfig) => void
  onStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'error', detail?: string) => void
}

/** iPad companion WebSocket stub — pushes scene_config to WebXR runtime. */
export class CompanionBridge {
  private socket: WebSocket | null = null
  private reconnectTimer: number | undefined

  constructor(
    private readonly callbacks: CompanionBridgeCallbacks,
    private readonly url = env.companionWsUrl,
  ) {}

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return
    this.callbacks.onStatus?.('connecting')
    try {
      this.socket = new WebSocket(this.url)
    } catch (e) {
      this.callbacks.onStatus?.('error', e instanceof Error ? e.message : String(e))
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => this.callbacks.onStatus?.('connected')
    this.socket.onclose = () => {
      this.callbacks.onStatus?.('disconnected')
      this.scheduleReconnect()
    }
    this.socket.onerror = () => this.callbacks.onStatus?.('error', 'WebSocket error')
    this.socket.onmessage = (event) => this.handleMessage(String(event.data))
  }

  disconnect() {
    window.clearTimeout(this.reconnectTimer)
    this.socket?.close()
    this.socket = null
  }

  private scheduleReconnect() {
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = window.setTimeout(() => this.connect(), 4000)
  }

  private handleMessage(raw: string) {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      if (data.type === 'ping') return
      const payload =
        data.type === 'scene_config' && data.scene_config != null
          ? data.scene_config
          : data.meta != null && data.narrative_beats != null
            ? data
            : null
      if (payload) {
        this.callbacks.onSceneConfig(sceneConfigSchema.parse(payload))
      }
    } catch (e) {
      console.warn('Companion message parse failed', e)
    }
  }
}
