import { Line, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { visualTokens, trendGlyph } from '@/config/visual-tokens'
import type { CheckionMetric } from '@/ui/CheckionDashboard'
import { animatedBarHeight } from './chartAnimation'

const REVEAL_SEC = 2.6
const SCREEN_W = 0.44
const SCREEN_H = 0.27
const CHART_FLOOR = -0.09
const MAX_BAR_H = 0.13
const BAR_W = 0.072
const BAR_DEPTH = 0.014
const GAP = 0.1

interface Props {
  metrics: CheckionMetric[]
  active: boolean
}

/** Diegetic bar chart on the monitor surface — 3D bars + grid, not a HUD overlay. */
export function CheckionMonitorDashboard3d({ metrics, active }: Props) {
  const progressRef = useRef(0)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
    if (active) progressRef.current = 0
  }, [active])

  useFrame((_, delta) => {
    if (!activeRef.current) return
    progressRef.current = Math.min(1, progressRef.current + delta / REVEAL_SEC)
  })

  const slice = metrics.slice(0, 3)
  const totalW = slice.length * BAR_W + (slice.length - 1) * GAP
  const startX = -totalW / 2 + BAR_W / 2
  const gridYs = [0.25, 0.5, 0.75, 1].map((t) => CHART_FLOOR + t * MAX_BAR_H)

  return (
    <group position={[0, 0, 0.024]}>
      <mesh renderOrder={61}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshStandardMaterial
          color="#0c1220"
          emissive="#1a2840"
          emissiveIntensity={0.15}
          metalness={0.1}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[0, 0, 0.001]} renderOrder={62}>
        <planeGeometry args={[SCREEN_W + 0.012, SCREEN_H + 0.012]} />
        <meshBasicMaterial color="#2a3548" wireframe transparent opacity={0.35} />
      </mesh>

      <Text
        position={[0, SCREEN_H / 2 - 0.03, 0.003]}
        fontSize={0.022}
        color={visualTokens.checkionAccent}
        anchorX="center"
        anchorY="middle"
        renderOrder={63}
      >
        CHECKION
      </Text>

      <Line
        points={[
          [startX - BAR_W, CHART_FLOOR, 0.002],
          [startX - BAR_W, CHART_FLOOR + MAX_BAR_H, 0.002],
        ]}
        color="#3d4d66"
        lineWidth={1}
      />

      {gridYs.map((y, i) => (
        <mesh key={i} position={[0, y, 0.002]} renderOrder={62}>
          <boxGeometry args={[SCREEN_W * 0.88, 0.0012, 0.001]} />
          <meshBasicMaterial color="#2a3a52" transparent opacity={0.55} />
        </mesh>
      ))}

      {slice.map((m, i) => {
        const x = startX + i * (BAR_W + GAP)
        const target = Math.max(0, Math.min(100, m.value ?? 0))
        const compare = m.comparison_value != null ? Math.max(0, Math.min(100, m.comparison_value)) : null
        return (
          <MetricBars
            key={m.label ?? i}
            x={x}
            label={m.label ?? '—'}
            targetPct={target}
            comparePct={compare}
            unit={m.unit}
            trend={m.trend}
            progressRef={progressRef}
            active={active}
          />
        )
      })}
    </group>
  )
}

function MetricBars({
  x,
  label,
  targetPct,
  comparePct,
  unit,
  trend,
  progressRef,
  active,
}: {
  x: number
  label: string
  targetPct: number
  comparePct: number | null
  unit?: string
  trend?: string
  progressRef: React.RefObject<number>
  active: boolean
}) {
  const barRef = useRef<Mesh>(null)
  const compareRef = useRef<Mesh>(null)
  const valueRef = useRef<Group>(null)

  useFrame(() => {
    const p = active ? progressRef.current : 0
    const h = active ? animatedBarHeight(targetPct, p, MAX_BAR_H) : 0
    const bar = barRef.current
    if (bar) {
      bar.scale.y = Math.max(0.002, h / MAX_BAR_H)
      bar.position.y = CHART_FLOOR + h / 2
    }
    const cmp = compareRef.current
    if (cmp && comparePct != null) {
      const ch = (comparePct / 100) * MAX_BAR_H
      cmp.scale.y = Math.max(0.002, ch / MAX_BAR_H)
      cmp.position.y = CHART_FLOOR + ch / 2
      cmp.visible = active
    }
    if (valueRef.current) {
      valueRef.current.position.set(x, CHART_FLOOR + h + 0.018, 0.006)
      valueRef.current.visible = h > 0.01
    }
  })

  return (
    <group>
      {comparePct != null && (
        <mesh ref={compareRef} position={[x, CHART_FLOOR, 0.003]} renderOrder={63}>
          <boxGeometry args={[BAR_W * 0.92, MAX_BAR_H, BAR_DEPTH * 0.7]} />
          <meshStandardMaterial
            color="#3a4a62"
            emissive="#3a4a62"
            emissiveIntensity={0.2}
            transparent
            opacity={0.45}
            metalness={0.1}
            roughness={0.7}
          />
        </mesh>
      )}
      <mesh ref={barRef} position={[x, CHART_FLOOR, 0.005]} renderOrder={64}>
        <boxGeometry args={[BAR_W, MAX_BAR_H, BAR_DEPTH]} />
        <meshStandardMaterial
          color={visualTokens.checkionAccent}
          emissive={visualTokens.checkionAccent}
          emissiveIntensity={0.45}
          metalness={0.25}
          roughness={0.45}
        />
      </mesh>
      <group ref={valueRef} visible={false}>
        <Text
          fontSize={0.017}
          color="#e8ecf4"
          anchorX="center"
          anchorY="bottom"
          renderOrder={65}
        >
          {`${targetPct}${unit ?? ''}${trend ? ` ${trendGlyph(trend)}` : ''}`}
        </Text>
      </group>
      <Text
        position={[x, CHART_FLOOR - 0.028, 0.004]}
        fontSize={0.013}
        color={visualTokens.textMuted}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.11}
        textAlign="center"
        renderOrder={65}
      >
        {label}
      </Text>
    </group>
  )
}
