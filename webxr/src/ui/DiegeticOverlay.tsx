import type { UiOverlay } from '@/schema/scene-config'
interface FeedItem {
  headline?: string
  source?: string
  category?: string
  relevance_score?: number
}

interface Props {
  overlay: UiOverlay
  items: FeedItem[]
  onClose: () => void
}

export function DiegeticOverlay({ overlay, items, onClose }: Props) {
  if (overlay.type !== 'news_feed') return null

  return (
    <div className="overlay-panel overlay-panel--echeon" role="dialog" aria-label="echeon Feed">
      <header>
        <span className="overlay-brand">echeon</span>
        <span className="overlay-sub">Intelligence Feed</span>
        <button type="button" onClick={onClose} aria-label="Schließen">
          ×
        </button>
      </header>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            {item.relevance_score != null && (
              <span className="overlay-score">{Math.round(item.relevance_score * 100)}%</span>
            )}
            <strong>{item.headline}</strong>
            <small>{item.source}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
