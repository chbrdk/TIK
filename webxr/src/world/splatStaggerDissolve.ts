import { dyno, type GsplatModifier, type SplatMesh } from '@sparkjsdev/spark'

export type StaggerDissolveMode = 'dissolve' | 'reveal'

export interface StaggerDissolveController {
  modifier: GsplatModifier
  setProgress: (progress: number) => void
  setSoftness: (softness: number) => void
  attach: (mesh: SplatMesh) => void
  detach: (mesh: SplatMesh) => void
}

/**
 * Per-splat dissolve/reveal: pseudo-random order by index, points fade one after another.
 */
export function createStaggerDissolveController(
  mode: StaggerDissolveMode,
): StaggerDissolveController {
  const progress = dyno.dynoFloat(0, 'staggerProgress')
  const softness = dyno.dynoFloat(0.14, 'staggerSoftness')
  const revealMode = dyno.dynoFloat(mode === 'reveal' ? 1 : 0, 'staggerRevealMode')

  const modifier = dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      const shader = dyno.dyno({
        inTypes: {
          gsplat: dyno.Gsplat,
          progress: 'float',
          softness: 'float',
          revealMode: 'float',
        },
        outTypes: { gsplat: dyno.Gsplat },
        statements: ({ inputs, outputs }) =>
          dyno.unindentLines(`
            ${outputs.gsplat} = ${inputs.gsplat};
            float order = fract(sin(float(${inputs.gsplat}.index) * 12.9898 + 78.233) * 43758.5453);
            float edge = smoothstep(order, order + ${inputs.softness}, ${inputs.progress});
            float keep = mix(1.0 - edge, edge, ${inputs.revealMode});
            ${outputs.gsplat}.rgba.a *= keep;
            float puff = mix(edge, 1.0 - edge, ${inputs.revealMode}) * 0.18;
            ${outputs.gsplat}.scales *= (1.0 + puff);
          `),
      })

      return {
        gsplat: shader.apply({
          gsplat,
          progress,
          softness,
          revealMode,
        }).gsplat,
      }
    },
  ) as GsplatModifier

  return {
    modifier,
    setProgress: (value) => {
      progress.value = Math.max(0, Math.min(1, value))
    },
    setSoftness: (value) => {
      softness.value = Math.max(0.02, Math.min(0.35, value))
    },
    attach(mesh) {
      mesh.objectModifier = modifier
      mesh.updateGenerator()
    },
    detach(mesh) {
      mesh.objectModifier = undefined
      mesh.updateGenerator()
    },
  }
}
