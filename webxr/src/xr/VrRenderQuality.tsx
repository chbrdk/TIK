import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { env } from '@/config/env'
import { desktopPixelRatio, vrPixelRatio } from '@/config/render-quality'

/** Applies pixel ratio + XR framebuffer scale for sharp desktop / VR rendering. */
export function VrRenderQuality() {
  const gl = useThree((s) => s.gl)
  const mode = useXR((s) => s.mode)
  const inVr = mode === 'immersive-vr' || mode === 'immersive-ar'

  useEffect(() => {
    if (!inVr) {
      gl.setPixelRatio(desktopPixelRatio())
      gl.xr.setFramebufferScaleFactor(1)
      return
    }
    gl.setPixelRatio(vrPixelRatio())
    gl.xr.setFramebufferScaleFactor(env.vrFramebufferScale)
  }, [gl, inVr])

  return null
}
