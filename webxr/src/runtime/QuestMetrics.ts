const STORAGE_KEY = 'persona-reality-quest-metrics'

export interface FpsSample {
  t: number
  fps: number
}

export interface QuestMetricsSnapshot {
  startedAt: string
  samples: FpsSample[]
  min: number
  max: number
  avg: number
}

export class QuestMetrics {
  private samples: FpsSample[] = []
  private readonly maxSamples = 600

  record(fps: number) {
    this.samples.push({ t: Date.now(), fps })
    if (this.samples.length > this.maxSamples) this.samples.shift()
  }

  snapshot(): QuestMetricsSnapshot {
    const values = this.samples.map((s) => s.fps)
    const sum = values.reduce((a, b) => a + b, 0)
    return {
      startedAt: new Date().toISOString(),
      samples: [...this.samples],
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      avg: values.length ? sum / values.length : 0,
    }
  }

  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot()))
  }

  static load(): QuestMetricsSnapshot | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as QuestMetricsSnapshot
    } catch {
      return null
    }
  }

  downloadJson() {
    const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quest-metrics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}
