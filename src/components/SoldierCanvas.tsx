/**
 * The visualization is structured around Quetelet's claim (Porter pp. 100–109):
 *
 * The 5,738 soldiers are not a diverse population. They are 5,738 flawed copies
 * of one ideal Scotsman, scattered around the type by accidental causes —
 * just as repeated measurements of a star scatter around its true position.
 * Deviation from the mean = error = imperfection.
 *
 * Therefore: the x-axis is DEVIATION FROM THE IDEAL (inches), centered at 0.
 * Each soldier starts at center (the type) and drifts to their error position.
 * The bell that emerges is the error curve — the same law that governs astronomy.
 */

import { useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { motion, AnimatePresence } from 'framer-motion'
import SoldierFigure, { chestToScale } from './SoldierFigure'
import { getPhaseBlend, PHASE_BOUNDARIES } from '../lib/phases'
import { normalPDF } from '../lib/stats'
import type { SoldierData } from '../lib/data'

interface Props {
  soldiers: number[]
  data: SoldierData
  width: number
  height: number
}

const MARGIN = { top: 68, right: 48, bottom: 96, left: 48 }
const X_DOMAIN: [number, number] = [-8.5, 8.5]  // deviation range in inches

export default function SoldierCanvas({ soldiers, data, width, height }: Props) {
  const n = soldiers.length
  const blend = getPhaseBlend(n)

  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom
  const centerX = MARGIN.left + innerW / 2
  const baseY = MARGIN.top + innerH

  // X: deviation from mean, centered
  const xScale = useMemo(
    () => d3.scaleLinear().domain(X_DOMAIN).range([MARGIN.left, MARGIN.left + innerW]),
    [innerW]
  )

  // Pixel width of one inch on the deviation axis
  const pxPerInch = useMemo(() => xScale(1) - xScale(0), [xScale])

  // Bin counts from current soldiers slice
  const binCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const c of soldiers) counts[c] = (counts[c] ?? 0) + 1
    return counts
  }, [soldiers])

  // Final max bin count (for stable y-scale)
  const maxBinCount = useMemo(
    () => Math.max(...data.bins.map(b => b.count), 1),
    [data.bins]
  )

  // Y scale: count → bar height in pixels (based on final dataset max, so scale is stable)
  const yBarScale = useMemo(
    () => d3.scaleLinear().domain([0, maxBinCount]).range([0, innerH]),
    [maxBinCount, innerH]
  )

  // ── Phase 1 positions: individual figures drifting from center ──
  const phase1Positions = useMemo(() => {
    const limit = Math.min(n, PHASE_BOUNDARIES.INDIVIDUALS_END)
    if (limit === 0) return []
    const colRank: Record<number, number> = {}
    const FIGURE_H = 62
    const SPACING = 44  // pixels between stacked figures

    return soldiers.slice(0, limit).map((chest, idx) => {
      const rank = colRank[chest] ?? 0
      colRank[chest] = rank + 1
      const deviation = chest - data.mean
      const finalX = xScale(deviation)
      const finalY = baseY - FIGURE_H * 0.5 - 8 - rank * SPACING
      // offset to animate from: bring figure to center
      const driftOffset = centerX - finalX
      return { idx, chest, deviation, finalX, finalY, driftOffset, cs: chestToScale(chest) }
    })
  }, [soldiers, n, data.mean, xScale, baseY, centerX])

  // ── Phase 2 positions: dots accumulating into bell shape ──
  const phase2Positions = useMemo(() => {
    const start = PHASE_BOUNDARIES.INDIVIDUALS_END
    const end = Math.min(n, PHASE_BOUNDARIES.SHRINKING_END)
    if (end <= start) return []

    // Compute max column in current slice to set spacing
    const tempCounts: Record<number, number> = {}
    soldiers.slice(0, end).forEach(c => { tempCounts[c] = (tempCounts[c] ?? 0) + 1 })
    const currentMax = Math.max(...Object.values(tempCounts), 1)
    const spacing = Math.max(3.5, Math.min(14, (innerH * 0.9) / currentMax))
    const dotR = Math.max(2.5, Math.min(6, spacing * 0.55))

    const colRank: Record<number, number> = {}
    return soldiers.slice(0, end).map((chest, idx) => {
      const rank = colRank[chest] ?? 0
      colRank[chest] = rank + 1
      const deviation = chest - data.mean
      const cx = xScale(deviation)
      const cy = baseY - dotR - rank * spacing
      return { idx, cx, cy, dotR }
    })
  }, [soldiers, n, data.mean, xScale, baseY, innerH])

  // ── Normal curve in deviation space ──
  const curvePath = useMemo(() => {
    const pts = d3.range(X_DOMAIN[0], X_DOMAIN[1], 0.04).map(dev => {
      // Normal curve centered at deviation=0, with population stdDev
      const density = normalPDF(dev, 0, data.stdDev)
      const scaledCount = density * data.total
      const px = xScale(dev)
      const py = baseY - yBarScale(scaledCount)
      return [px, py] as [number, number]
    })
    return (
      d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveCatmullRom.alpha(0.5))(pts) ?? ''
    )
  }, [data.stdDev, data.total, xScale, yBarScale, baseY])

  // Animate curve draw-in on first appearance
  const curveRef = useRef<SVGPathElement>(null)
  const curveDrawn = useRef(false)
  useEffect(() => {
    const el = curveRef.current
    if (!el || curveDrawn.current || blend.curveOpacity < 0.01) return
    curveDrawn.current = true
    const len = el.getTotalLength()
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 2.6s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.strokeDashoffset = '0'
    })
  }, [blend.curveOpacity])

  // Axis tick deviations
  const axisTicks = [-6, -4, -2, 0, 2, 4, 6, 8]

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block' }}
      aria-label="Deviation of Scottish soldiers from the ideal type"
    >

      {/* ─── Center line: the ideal ─── */}
      <g opacity={0.5}>
        <line
          x1={centerX} y1={MARGIN.top + 8}
          x2={centerX} y2={baseY}
          stroke="var(--ink-faded)"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <text
          x={centerX}
          y={MARGIN.top - 10}
          textAnchor="middle"
          fontFamily="'EB Garamond', serif"
          fontStyle="italic"
          fontSize={17}
          fill="var(--ink-faded)"
        >
          l'homme type
        </text>
      </g>

      {/* ─── Ghost ideal figure at n = 0 ─── */}
      <AnimatePresence>
        {n === 0 && (
          <motion.g
            key="ideal-ghost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            transition={{ duration: 1.0 }}
          >
            <SoldierFigure
              x={centerX}
              y={baseY - 64}
              size={96}
              chestScale={1.0}
              opacity={0.22}
              isIdeal
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* ─── Phase 1: figures drifting from ideal to their error position ─── */}
      <g opacity={blend.individualsOpacity} style={{ transition: 'opacity 0.8s ease' }}>
        <AnimatePresence>
          {phase1Positions.map(({ idx, finalX, finalY, driftOffset, cs }) => (
            <motion.g
              key={idx}
              initial={{ x: driftOffset, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                x: { duration: 1.1, ease: [0.4, 0, 0.1, 1] },
                opacity: { duration: 0.25 },
              }}
            >
              <SoldierFigure
                x={finalX}
                y={finalY}
                size={62}
                chestScale={cs}
                opacity={0.88}
              />
            </motion.g>
          ))}
        </AnimatePresence>
      </g>

      {/* ─── Phase 2: dots accumulating into bell shape ─── */}
      <g
        opacity={blend.columnsOpacity * (1 - blend.histogramOpacity)}
        style={{ transition: 'opacity 0.7s ease', mixBlendMode: 'multiply' }}
      >
        {phase2Positions.map(({ idx, cx, cy, dotR }) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={dotR}
            fill="var(--ink-primary)"
            opacity={0.45}
          />
        ))}
      </g>

      {/* ─── Phase 3: histogram bars ─── */}
      <g opacity={blend.histogramOpacity} style={{ transition: 'opacity 0.8s ease' }}>
        {data.bins.map(bin => {
          const count = binCounts[bin.chest] ?? 0
          if (count === 0) return null
          const deviation = bin.chest - data.mean
          const bx = xScale(deviation)
          const barW = pxPerInch * 0.78
          const barH = yBarScale(count)
          return (
            <rect
              key={bin.chest}
              x={bx - barW / 2}
              y={baseY - barH}
              width={barW}
              height={barH}
              fill="var(--ink-secondary)"
              opacity={0.68}
              rx={1}
            />
          )
        })}
      </g>

      {/* ─── Normal curve ─── */}
      {blend.curveOpacity > 0.005 && (
        <path
          ref={curveRef}
          d={curvePath}
          fill="none"
          stroke="var(--accent-red)"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={blend.curveOpacity * 0.92}
        />
      )}

      {/* ─── Error law formula ─── */}
      <motion.g
        animate={{ opacity: blend.curveOpacity > 0.6 ? blend.curveOpacity * 0.82 : 0 }}
        transition={{ duration: 1.0 }}
      >
        {/* Label */}
        <text
          x={centerX}
          y={MARGIN.top + 34}
          textAnchor="middle"
          fontFamily="'EB Garamond', serif"
          fontStyle="italic"
          fontSize={24}
          fill="var(--accent-red)"
          opacity={0.85}
        >
          the law of errors
        </text>
        {/* Formula */}
        <text
          x={centerX}
          y={MARGIN.top + 60}
          textAnchor="middle"
          fontFamily="'EB Garamond', serif"
          fontSize={19}
          fill="var(--accent-red)"
          opacity={0.7}
        >
          {'φ(ε) = 1/σ√2π · exp(−ε²/2σ²)'}
        </text>
      </motion.g>

      {/* ─── X axis ─── */}
      <g opacity={blend.columnsOpacity} style={{ transition: 'opacity 0.7s ease' }}>
        <line
          x1={MARGIN.left} y1={baseY}
          x2={MARGIN.left + innerW} y2={baseY}
          stroke="var(--ink-faded)"
          strokeWidth={0.7}
        />
        {axisTicks.map(dev => {
          const px = xScale(dev)
          const rawInches = data.mean + dev
          return (
            <g key={dev}>
              <line
                x1={px} y1={baseY}
                x2={px} y2={baseY + 5}
                stroke="var(--ink-faded)"
                strokeWidth={0.7}
              />
              {/* Deviation label */}
              <text
                x={px} y={baseY + 20}
                textAnchor="middle"
                fontSize={12}
                fontFamily="'JetBrains Mono', monospace"
                fill="var(--ink-faded)"
              >
                {dev === 0 ? '0' : dev > 0 ? `+${dev}` : `${dev}`}
              </text>
              {/* Raw size label, secondary */}
              <text
                x={px} y={baseY + 36}
                textAnchor="middle"
                fontSize={10}
                fontFamily="'JetBrains Mono', monospace"
                fill="var(--ink-faded)"
                opacity={0.5}
              >
                {rawInches.toFixed(0)}″
              </text>
            </g>
          )
        })}
        {/* Axis title */}
        <text
          x={MARGIN.left + innerW / 2}
          y={baseY + 64}
          textAnchor="middle"
          fontSize={14}
          fontFamily="'EB Garamond', serif"
          fontStyle="italic"
          fill="var(--ink-secondary)"
          opacity={0.8}
        >
          deviation from type (inches)
        </text>
      </g>

      {/* ─── Astronomical inset ─── */}
      <motion.g
        animate={{ opacity: blend.curveOpacity > 0.8 ? 0.9 : 0 }}
        transition={{ duration: 1.4, delay: 0.8 }}
      >
        <AstronomicalInset
          x={MARGIN.left + 8}
          y={MARGIN.top + 16}
          w={162}
          h={100}
          stdDev={1}
          baseY={baseY}
          yBarScale={yBarScale}
          total={data.total}
        />
      </motion.g>

    </svg>
  )
}

// ── Astronomical inset ──────────────────────────────────────────────────────
// Shows "repeated measurements of a fixed star" producing the identical bell.
// Quetelet's argument: the same error law governs both.

interface InsetProps {
  x: number
  y: number
  w: number
  h: number
  stdDev: number
  baseY: number
  yBarScale: d3.ScaleLinear<number, number>
  total: number
}

function AstronomicalInset({ x, y, w, h }: InsetProps) {
  const pts = d3.range(-3.5, 3.5, 0.08).map(dev => {
    const density = normalPDF(dev, 0, 1)
    const py = y + h - density * h * 2.35
    const px = x + ((dev + 3.5) / 7) * w
    return [px, py] as [number, number]
  })
  const pathD =
    d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveCatmullRom.alpha(0.5))(pts) ?? ''

  // Simulate a few observation tick marks along the base
  const ticks = [-2.1, -1.4, -0.8, -0.3, 0.1, 0.6, 1.2, 1.9, 2.6]

  return (
    <g>
      {/* Panel background */}
      <rect
        x={x - 6} y={y - 22}
        width={w + 12} height={h + 44}
        fill="var(--vellum-shadow)"
        opacity={0.7}
        rx={2}
      />
      <rect
        x={x - 6} y={y - 22}
        width={w + 12} height={h + 44}
        fill="none"
        stroke="var(--ink-faded)"
        strokeWidth={0.5}
        rx={2}
        opacity={0.35}
      />

      {/* Caption: above */}
      <text
        x={x + w / 2} y={y - 8}
        textAnchor="middle"
        fontSize={10.5}
        fontFamily="'EB Garamond', serif"
        fontStyle="italic"
        fill="var(--ink-faded)"
      >
        repeated measurements of a star
      </text>

      {/* Baseline */}
      <line
        x1={x} y1={y + h}
        x2={x + w} y2={y + h}
        stroke="var(--ink-faded)"
        strokeWidth={0.5}
        opacity={0.4}
      />

      {/* Observation ticks */}
      {ticks.map((dev, i) => {
        const px = x + ((dev + 3.5) / 7) * w
        return (
          <line
            key={i}
            x1={px} y1={y + h}
            x2={px} y2={y + h + 4}
            stroke="var(--ink-faded)"
            strokeWidth={0.8}
            opacity={0.4}
          />
        )
      })}

      {/* Bell curve */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--ink-faded)"
        strokeWidth={1.2}
        opacity={0.55}
      />

      {/* Center line */}
      <line
        x1={x + w / 2} y1={y}
        x2={x + w / 2} y2={y + h}
        stroke="var(--ink-faded)"
        strokeWidth={0.6}
        strokeDasharray="2 4"
        opacity={0.3}
      />

      {/* Footer */}
      <text
        x={x + w / 2} y={y + h + 18}
        textAnchor="middle"
        fontSize={11}
        fontFamily="'EB Garamond', serif"
        fontStyle="italic"
        fill="var(--ink-faded)"
        opacity={0.75}
      >
        the same law governs both.
      </text>
    </g>
  )
}
