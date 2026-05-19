import { createXRStore } from '@react-three/xr'

/**
 * Quest: domOverlay=false → echte Immersion (kein Browser-Fenster im VR).
 * Weniger optionalFeatures → stabilere Session auf Gerät.
 */
export const xrStore = createXRStore({
  controller: true,
  hand: false,
  gaze: true,
  screenInput: false,
  domOverlay: false,
  anchors: false,
  meshDetection: false,
  planeDetection: false,
  hitTest: false,
  handTracking: false,
})
