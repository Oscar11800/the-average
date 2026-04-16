import { useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { motion, AnimatePresence } from 'framer-motion'
import SoldierFigure, { chestToScale } from './SoldierFigure'
import { getPhaseBlend, PHASE_BOUNDARIES } from '../lib/phases'
import { normalPDF } from '../lib/stats'
import type { SoldierData } from '../lib/data'

interface Props {
  soldiers: number[]          // pre-shuffled chest values, length = scrubPosition
  data: SoldierData
  width: number
  height: number
}

const CHEST_SIZES = Array.from({ length: 16 }, (_, i) => i + 33)
const MARGIN = { top: 40, right: 40, bottom: 60, left: 50 }

export default function SoldierCanvas({ soldiers, data, width, height }: Props) {
  const n = soldiers.length
  const blend = getPhaseBlend(n)

  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom

  // D3 scales
  const xScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(CHEST_SIZES.map(String))
        .range([0, innerW])
        .padding(0.15),
    [innerW]
  )

  const binCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const c of soldiers) counts[c] = (counts[c] ?? 0) + 1
    return counts
  }, [soldiers])

  const maxCount = useMemo(
    () => Math.max(...data.bins.map((b) => b.count)),
    [data.bins]
  )

  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, maxCount]).range([innerH, 0]),
    [innerH, maxCount]
  )

  // Normal curve path
  const curvePath = useMemo(() => {
    const pts = d3.range(31.5, 49.5, 0.1).map((x) => {
      const density = normalPDF(x, data.mean, data.stdDev)
      // Scale to histogram: density * total * binWidth(=1)
      const scaledCount = density * data.total
      return [x, scaledCount] as [number, number]
    })

    const lineGen = d3
      .line<[number, number]>()
      .x(([x]) => {
        // Map continuous x to pixel: x-axis is band scale, so interpolate
        const fraction = (x - 33) / (48 - 33)
        return fraction * innerW
      })
      .y(([, y]) => yScale(y))
      .curve(d3.curveCatmullRom)

    return lineGen(pts) ?? ''
  }, [data.mean, data.stdDev, data.total, innerW, yScale])

  // Curve draw-in animation using stroke-dasharray
  const curveRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    if (!curveRef.current) return
    const len = curveRef.current.getTotalLength()
    curveRef.current.style.strokeDasharray = `${len}`
    curveRef.current.style.strokeDashoffset = blend.curveOpacity > 0.01
      ? `${len * (1 - blend.curveOpacity)}`
      : `${len}`
  }, [blend.curveOpacity])

  // Phase 1: individual glyphs in a soft grid
  const gridSoldiers = useMemo(() => {
    if (n === 0) return []
    const cols = Math.ceil(Math.sqrt(n * 1.6))
    return soldiers.slice(0, Math.min(n, PHASE_BOUNDARIES.INDIVIDUALS_END)).map((chest, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cellW = innerW / cols
      const cellH = innerH / Math.ceil(n / cols)
      return {
        id: i,
        chest,
        x: MARGIN.left + col * cellW + cellW / 2,
        y: MARGIN.top + row * cellH + cellH / 2,
        h: Math.min(cellW, cellH) * 0.75,
      }
    })
  }, [soldiers, n, innerW, innerH])

  // Phase 2: column-sorted glyphs (shrinking crowd)
  const columnSoldiers = useMemo(() => {
    if (n === 0) return []
    const slice = soldiers.slice(0, Math.min(n, PHASE_BOUNDARIES.SHRINKING_END))
    // Group into bins
    const groups: Record<number, number[]> = {}
    slice.forEach((chest, i) => {
      if (!groups[chest]) groups[chest] = []
      groups[chest]!.push(i)
    })

    const items: { id: number; chest: number; x: number; y: number; h: number }[] = []
    for (const chest of CHEST_SIZES) {
      const ids = groups[chest] ?? []
      const bx = (xScale(String(chest)) ?? 0) + xScale.bandwidth() / 2
      const maxPerCol = Math.max(ids.length, 1)
      const figH = Math.min(40, innerH / maxPerCol)
      ids.forEach((id, rank) => {
        items.push({
          id,
          chest,
          x: MARGIN.left + bx,
          y: MARGIN.top + innerH - rank * figH - figH / 2,
          h: figH * 0.85,
        })
      })
    }
    return items
  }, [soldiers, n, xScale, innerH])

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block' }}
      aria-label="Scottish soldiers visualization"
    >
      <defs>
        <filter id="ink-blur">
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </defs>

      {/* ── Phase 1: individual glyphs ── */}
      <g opacity={blend.individualsOpacity} style={{ transition: 'opacity 0.6s ease' }}>
        <AnimatePresence>
          {gridSoldiers.map(({ id, chest, x, y, h }) => (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <SoldierFigure
                x={x} y={y} height={h}
                chestScale={chestToScale(chest)}
              />
            </motion.g>
          ))}
        </AnimatePresence>

        {/* Ideal ghost figure */}
        {n === 0 && (
          <SoldierFigure
            x={MARGIN.left + innerW / 2}
            y={MARGIN.top + innerH / 2}
            height={120}
            chestScale={1.0}
            isIdeal
            opacity={0.45}
          />
        )}
      </g>

      {/* ── Phase 2: column crowd ── */}
      <g opacity={blend.columnsOpacity * (1 - blend.histogramOpacity)} style={{ transition: 'opacity 0.4s ease' }}>
        {columnSoldiers.map(({ id, chest, x, y, h }) => (
          <SoldierFigure
            key={id}
            x={x} y={y} height={h}
            chestScale={chestToScale(chest)}
            opacity={1}
          />
        ))}
      </g>

      {/* ── Phase 3: histogram bars ── */}
      <g opacity={blend.histogramOpacity} style={{ transition: 'opacity 0.5s ease' }}>
        {CHEST_SIZES.map((chest) => {
          const count = binCounts[chest] ?? 0
          if (count === 0) return null
          const bx = (xScale(String(chest)) ?? 0)
          const bw = xScale.bandwidth()
          const barH = innerH - yScale(count)
          return (
            <rect
              key={chest}
              x={MARGIN.left + bx}
              y={MARGIN.top + yScale(count)}
              width={bw}
              height={barH}
              fill="var(--ink-secondary)"
              opacity={0.75}
              rx={1}
            />
          )
        })}
      </g>

      {/* ── Normal curve ── */}
      {blend.curveOpacity > 0.01 && (
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          <path
            ref={curveRef}
            d={curvePath}
            fill="none"
            stroke="var(--accent-red)"
            strokeWidth={2}
            opacity={blend.curveOpacity * 0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* ── Axes (fade in with columns) ── */}
      <g opacity={blend.columnsOpacity} style={{ transition: 'opacity 0.5s ease' }}>
        {/* X axis */}
        <line
          x1={MARGIN.left} y1={MARGIN.top + innerH}
          x2={MARGIN.left + innerW} y2={MARGIN.top + innerH}
          stroke="var(--ink-faded)" strokeWidth={0.8}
        />
        {CHEST_SIZES.map((chest) => {
          const bx = (xScale(String(chest)) ?? 0) + xScale.bandwidth() / 2
          return (
            <text
              key={chest}
              x={MARGIN.left + bx}
              y={MARGIN.top + innerH + 18}
              textAnchor="middle"
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fill="var(--ink-faded)"
            >
              {chest}
            </text>
          )
        })}
        <text
          x={MARGIN.left + innerW / 2}
          y={MARGIN.top + innerH + 38}
          textAnchor="middle"
          fontSize={11}
          fontFamily="'EB Garamond', serif"
          fontStyle="italic"
          fill="var(--ink-secondary)"
        >
          chest circumference (inches)
        </text>
      </g>

      {/* Y axis (histogram only) */}
      <g opacity={blend.histogramOpacity} style={{ transition: 'opacity 0.5s ease' }}>
        <line
          x1={MARGIN.left} y1={MARGIN.top}
          x2={MARGIN.left} y2={MARGIN.top + innerH}
          stroke="var(--ink-faded)" strokeWidth={0.8}
        />
        {yScale.ticks(5).map((t) => (
          <text
            key={t}
            x={MARGIN.left - 8}
            y={MARGIN.top + yScale(t) + 4}
            textAnchor="end"
            fontSize={10}
            fontFamily="'JetBrains Mono', monospace"
            fill="var(--ink-faded)"
          >
            {t}
          </text>
        ))}
      </g>
    </svg>
  )
}
