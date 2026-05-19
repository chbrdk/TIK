import { Suspense } from 'react'
import { Text } from '@react-three/drei'
import type { UiOverlay } from '@/schema/scene-config'
import { visualTokens } from '@/config/visual-tokens'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { PanelFrame3d } from './ui3d/PanelFrame3d'
import { MetricBar3d } from './ui3d/MetricBar3d'
import { QrCode3d } from './ui3d/QrCode3d'

interface FeedItem {
  headline?: string
  source?: string
  relevance_score?: number
}

interface Props {
  overlay: UiOverlay
  feedItems: FeedItem[]
  checkionMetrics: CheckionMetric[]
  reportQrUrl?: string | null
  renderOrder?: number
  faceCamera?: boolean
}

export function OverlayPanelContent({
  overlay,
  feedItems,
  checkionMetrics,
  reportQrUrl,
  renderOrder = 80,
  faceCamera = false,
}: Props) {
  const height =
    overlay.type === 'dashboard' ? 0.48 : overlay.type === 'qr_code' ? 0.58 : 0.78
  const width = 0.64
  const accent =
    overlay.type === 'dashboard'
      ? visualTokens.checkionAccent
      : overlay.type === 'qr_code'
        ? visualTokens.brandYellow
        : visualTokens.echeonAccent

  return (
    <group rotation={faceCamera ? [0, 0, 0] : [0, Math.PI, 0]}>
      <PanelFrame3d width={width} height={height} accent={accent} renderOrder={renderOrder}>
        {overlay.type === 'news_feed' && (
          <>
            <Text
              position={[0, height / 2 - 0.06, 0.02]}
              fontSize={0.048}
              color={visualTokens.echeonAccent}
              anchorX="center"
              anchorY="middle"
              renderOrder={renderOrder + 3}
            >
              echeon
            </Text>
            <Text
              position={[0, height / 2 - 0.11, 0.02]}
              fontSize={0.024}
              color={visualTokens.textMuted}
              anchorX="center"
              anchorY="middle"
              renderOrder={renderOrder + 3}
            >
              Relevant für Klaus
            </Text>
            {feedItems.slice(0, 3).map((item, i) => (
              <group key={i} position={[0, 0.12 - i * 0.2, 0]}>
                <Text
                  position={[0, 0.04, 0.02]}
                  fontSize={0.028}
                  color={visualTokens.textPrimary}
                  anchorX="center"
                  anchorY="top"
                  maxWidth={width - 0.08}
                  textAlign="center"
                  renderOrder={renderOrder + 3}
                >
                  {item.headline ?? '—'}
                </Text>
                <Text
                  position={[0, -0.02, 0.02]}
                  fontSize={0.02}
                  color={visualTokens.textMuted}
                  anchorX="center"
                  anchorY="top"
                  renderOrder={renderOrder + 3}
                >
                  {`${item.source ?? 'Quelle'}${item.relevance_score != null ? ` · ${Math.round(item.relevance_score * 100)}%` : ''}`}
                </Text>
              </group>
            ))}
          </>
        )}

        {overlay.type === 'dashboard' && (
          <>
            <Text
              position={[0, height / 2 - 0.06, 0.02]}
              fontSize={0.046}
              color={visualTokens.checkionAccent}
              anchorX="center"
              anchorY="middle"
              renderOrder={renderOrder + 3}
            >
              CHECKION
            </Text>
            {checkionMetrics.slice(0, 3).map((m, i) => (
              <MetricBar3d
                key={i}
                label={m.label ?? 'Metric'}
                value={m.value ?? 0}
                unit={m.unit}
                trend={m.trend}
                x={0}
                y={0.06 - i * 0.14}
                accent={visualTokens.checkionAccent}
                renderOrder={renderOrder}
              />
            ))}
          </>
        )}

        {overlay.type === 'qr_code' && (
          <>
            <Text
              position={[0, height / 2 - 0.07, 0.02]}
              fontSize={0.044}
              color={visualTokens.brandYellow}
              anchorX="center"
              anchorY="middle"
              renderOrder={renderOrder + 3}
            >
              Persona Report
            </Text>
            {reportQrUrl && (
              <Suspense fallback={null}>
                <QrCode3d url={reportQrUrl} size={0.3} renderOrder={renderOrder + 3} />
              </Suspense>
            )}
            <Text
              position={[0, -height / 2 + 0.06, 0.02]}
              fontSize={0.022}
              color={visualTokens.textMuted}
              anchorX="center"
              anchorY="middle"
              maxWidth={width - 0.06}
              textAlign="center"
              renderOrder={renderOrder + 3}
            >
              {reportQrUrl?.replace(/^https?:\/\//, '') ?? 'msqdx.de/pr/…'}
            </Text>
          </>
        )}
      </PanelFrame3d>
    </group>
  )
}
