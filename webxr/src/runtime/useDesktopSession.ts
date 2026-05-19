import { useEffect } from 'react'
import { SESSION_ACTS } from '@/config/environments'

interface Options {
  enabled: boolean
  onSwitchAct: (act: number) => void
  onAdvanceAct: () => void
  onDismissOverlay: () => void
  onTriggerAnchor?: (anchorId: string) => void
}

/** Keyboard shortcuts for browser testing (no headset). */
export function useDesktopSession({
  enabled,
  onSwitchAct,
  onAdvanceAct,
  onDismissOverlay,
  onTriggerAnchor,
}: Options): void {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const act = Number(event.key)
      if (act >= 1 && act <= 5 && SESSION_ACTS.includes(act as (typeof SESSION_ACTS)[number])) {
        event.preventDefault()
        onSwitchAct(act)
        return
      }

      if (event.key === 'n' || event.key === 'N' || event.key === 'ArrowRight') {
        event.preventDefault()
        onAdvanceAct()
        return
      }

      if (event.key === 'Escape') {
        onDismissOverlay()
      }

      if ((event.key === 'm' || event.key === 'M') && onTriggerAnchor) {
        event.preventDefault()
        onTriggerAnchor('monitor_left')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, onSwitchAct, onAdvanceAct, onDismissOverlay, onTriggerAnchor])
}
