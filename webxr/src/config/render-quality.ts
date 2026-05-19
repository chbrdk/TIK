import type { WebGLRenderer } from 'three'
import { env } from './env'

export interface SparkQualityOptions {
  renderer: WebGLRenderer
  enableLod: boolean
  encodeLinear: boolean
  maxPixelRadius?: number
}

/** SparkRenderer args — high detail on desktop, balanced in VR. */
export function sparkRendererOptions(
  renderer: WebGLRenderer,
  inVr: boolean,
): SparkQualityOptions {
  const highQuality = !inVr && env.highQualityDesktop
  return {
    renderer,
    enableLod: inVr ? env.enableLodInVr : !highQuality,
    encodeLinear: highQuality && env.encodeLinearSplats,
    maxPixelRadius: highQuality ? env.sparkMaxPixelRadiusDesktop : env.sparkMaxPixelRadiusVr,
  }
}

export function canvasDprBounds(): [number, number] {
  return [1, env.canvasMaxDpr]
}

export function desktopPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, env.desktopMaxPixelRatio)
}

export function vrPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, env.vrMaxPixelRatio)
}
