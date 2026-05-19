interface Props {
  text: string | null
  trackId?: string | null
  lineIndex?: number
  totalLines?: number
  visible: boolean
}

export function NovaSubtitle({ text, trackId, lineIndex, totalLines, visible }: Props) {
  if (!visible || !text) return null
  const progress =
    totalLines != null && totalLines > 1 && lineIndex != null
      ? ` ${lineIndex + 1}/${totalLines}`
      : ''

  return (
    <div className="nova-subtitle" aria-live="polite">
      <span className="nova-label">NOVA{progress}</span>
      <p className="nova-text">{text}</p>
      {trackId && import.meta.env.DEV && (
        <span className="nova-track nova-track--dev">{trackId}</span>
      )}
    </div>
  )
}
