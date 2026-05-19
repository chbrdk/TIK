import { lightingForPreset } from '@/config/lighting-presets'

interface Props {
  preset?: string
}

export function LightingRig({ preset }: Props) {
  const cfg = lightingForPreset(preset)
  return (
    <>
      <color attach="background" args={[cfg.background]} />
      <ambientLight intensity={cfg.ambient} color={cfg.color} />
      <directionalLight position={[3, 5, 2]} intensity={cfg.directional} color={cfg.color} />
    </>
  )
}
