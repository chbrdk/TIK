import { SESSION_ACTS, type SessionAct } from '@/config/environments'
import type { NarrativeEvent, NarrativeListener } from './narrative-events'

/**
 * Session progression driven by narrative cues (act_complete / session_complete).
 */
export class SessionFlow {
  private readonly onAdvance: (nextAct: SessionAct) => void
  private readonly getCurrentAct: () => number
  private readonly onSessionComplete: () => void
  private boundListener: NarrativeListener

  constructor(
    onAdvance: (nextAct: SessionAct) => void,
    getCurrentAct: () => number,
    onSessionComplete: () => void,
  ) {
    this.onAdvance = onAdvance
    this.getCurrentAct = getCurrentAct
    this.onSessionComplete = onSessionComplete
    this.boundListener = (event) => this.handleEvent(event)
  }

  get listener(): NarrativeListener {
    return this.boundListener
  }

  static firstAct(): SessionAct {
    return SESSION_ACTS[0]
  }

  static nextAct(act: number): SessionAct | null {
    const idx = SESSION_ACTS.indexOf(act as SessionAct)
    if (idx < 0 || idx >= SESSION_ACTS.length - 1) return null
    return SESSION_ACTS[idx + 1]
  }

  static isLastAct(act: number): boolean {
    return act >= SESSION_ACTS[SESSION_ACTS.length - 1]
  }

  private handleEvent(event: NarrativeEvent) {
    if (event.type === 'act_complete') {
      const next = SessionFlow.nextAct(this.getCurrentAct())
      if (next != null) this.onAdvance(next)
    } else if (event.type === 'session_complete') {
      this.onSessionComplete()
    }
  }

  dispose() {
    /* listener held by App — no timers */
  }
}
