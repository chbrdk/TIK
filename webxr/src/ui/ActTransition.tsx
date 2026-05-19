interface Props {
  visible: boolean
  label?: string
  /** During splat crossfade: label only, no opaque overlay. */
  subtle?: boolean
}

/** Status while the next act loads (opaque) or during splat crossfade (subtle). */
export function ActTransition({ visible, label, subtle }: Props) {
  if (!visible) return null
  return (
    <div
      className={subtle ? 'act-transition act-transition--subtle' : 'act-transition'}
      role="status"
      aria-live="polite"
    >
      <p>{label ?? 'Nächster Akt…'}</p>
    </div>
  )
}
