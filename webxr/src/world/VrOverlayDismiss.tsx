import { useRef } from 'react'
import {
  useXRControllerButtonEvent,
  useXRInputSourceState,
} from '@react-three/xr'

interface Props {
  enabled: boolean
  onDismiss: () => void
}

/** Grip or B while overlay open → close (no hotspot hit required). */
export function VrOverlayDismiss({ enabled, onDismiss }: Props) {
  const right = useXRInputSourceState('controller', 'right')
  const left = useXRInputSourceState('controller', 'left')
  const controller = right ?? left
  const firedRef = useRef(false)

  const dismiss = () => {
    if (!enabled || firedRef.current) return
    firedRef.current = true
    onDismiss()
    window.setTimeout(() => {
      firedRef.current = false
    }, 400)
  }

  useXRControllerButtonEvent(controller, 'xr-standard-squeeze', (state) => {
    if (state === 'pressed') dismiss()
  })
  useXRControllerButtonEvent(controller, 'a-button', (state) => {
    if (state === 'pressed') dismiss()
  })

  return null
}
