/** Loops ambient audio keyed by scene_config ambient_audio_id. */
export class AmbientAudio {
  private ctx: AudioContext | null = null
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null

  async playLoop(url: string, volume = 0.35) {
    await this.stop()
    this.ctx ??= new AudioContext()
    const response = await fetch(url)
    if (!response.ok) throw new Error(`ambient fetch ${response.status}`)
    const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer())
    this.source = this.ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true
    this.gain = this.ctx.createGain()
    this.gain.gain.value = volume
    this.source.connect(this.gain)
    this.gain.connect(this.ctx.destination)
    this.source.start(0)
  }

  async stop() {
    try {
      this.source?.stop()
    } catch {
      /* already stopped */
    }
    this.source = null
    this.gain = null
  }

  dispose() {
    void this.stop()
    void this.ctx?.close()
    this.ctx = null
  }
}
