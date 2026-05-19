import type { UiOverlay } from '@/schema/scene-config'
import { DiegeticOverlay } from './DiegeticOverlay'
import { CheckionDashboard, type CheckionMetric } from './CheckionDashboard'

interface FeedItem {
  headline?: string
  source?: string
  relevance_score?: number
}

interface Props {
  overlay: UiOverlay
  feedItems: FeedItem[]
  checkionMetrics: CheckionMetric[]
  onClose: () => void
}

export function OverlayPanel({ overlay, feedItems, checkionMetrics, onClose }: Props) {
  if (overlay.type === 'news_feed') {
    return <DiegeticOverlay overlay={overlay} items={feedItems} onClose={onClose} />
  }
  if (overlay.type === 'dashboard') {
    return <CheckionDashboard overlay={overlay} metrics={checkionMetrics} onClose={onClose} />
  }
  return null
}
